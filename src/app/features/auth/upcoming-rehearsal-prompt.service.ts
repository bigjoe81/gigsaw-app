import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Gig, RehearsalSession } from '../../core/models/band-resources.models';
import { BandContextService } from '../../core/services/band-context.service';
import { BandResourceApiService } from '../../core/services/band-resource-api.service';
import { OverlayService, ToastService } from '../../shared/ui/native-ui';
import { BandService } from '../bands/services/band.service';
import { Band } from '../bands/models/band.models';
import {
  UpcomingBandEvent,
  UpcomingEventsOnboardingModalComponent,
} from './upcoming-events-onboarding-modal.component';

interface BandEvents {
  band: Band;
  rehearsals: RehearsalSession[];
  gigs: Gig[];
}

@Injectable({ providedIn: 'root' })
export class UpcomingRehearsalPromptService {
  private readonly bands = inject(BandService);
  private readonly resources = inject(BandResourceApiService);
  private readonly overlays = inject(OverlayService);
  private readonly toast = inject(ToastService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);

  openUpcomingEvents(targetBandId?: number): void {
    this.bands.listUserBands().pipe(
      map((bands) => bands.filter((band) => Number.isInteger(band.id) && band.id > 0
        && (targetBandId === undefined || band.id === targetBandId))),
      switchMap((bands) => bands.length
        ? forkJoin(bands.map((band) => forkJoin({
          band: of(band),
          rehearsals: this.resources.list<RehearsalSession>(band.id, 'rehearsal-sessions'),
          gigs: this.resources.list<Gig>(band.id, 'gigs'),
        })))
        : of([])),
      catchError((error: unknown) => {
        console.error('Impossibile controllare le prove imminenti.', error);
        void this.showLookupError();
        return of(null);
      }),
    ).subscribe({
      next: (results) => {
        if (results === null) return;
        const events = this.upcomingEvents(results);
        void this.prompt(results, events);
      },
    });
  }

  nextEvent(bandId: number): Observable<UpcomingBandEvent | null> {
    return forkJoin({
      rehearsals: this.resources.list<RehearsalSession>(bandId, 'rehearsal-sessions'),
      gigs: this.resources.list<Gig>(bandId, 'gigs'),
    }).pipe(
      map(({ rehearsals, gigs }) => this.upcomingEvents([{ band: { id: bandId } as Band, rehearsals, gigs }])[0] ?? null),
      catchError(() => of(null)),
    );
  }

  prepareEvent(event: UpcomingBandEvent): void {
    this.bandContext.setCurrentBand(event.bandId);
    void this.router.navigateByUrl(`/band/${event.bandId}/${event.type === 'rehearsal' ? 'prove' : 'concerti'}/${event.eventId}`);
  }

  private upcomingEvents(bandEvents: BandEvents[]): UpcomingBandEvent[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return bandEvents.flatMap(({ band, rehearsals, gigs }) => [
      ...rehearsals
        .filter((rehearsal) => !['cancelled', 'completed'].includes((rehearsal.status || '').toLowerCase()))
        .map((rehearsal): UpcomingBandEvent => ({
          id: `rehearsal:${band.id}:${rehearsal.id}`,
          bandId: band.id,
          type: 'rehearsal',
          eventId: rehearsal.id,
          title: rehearsal.title || 'Prova',
          date: rehearsal.date,
          timestamp: this.timestamp(rehearsal.date, rehearsal.startTime),
          time: rehearsal.startTime,
          location: rehearsal.rehearsalRoom?.name ?? null,
        })),
      ...gigs.map((gig): UpcomingBandEvent => ({
        id: `gig:${band.id}:${gig.id}`,
        bandId: band.id,
        type: 'gig',
        eventId: gig.id,
        title: gig.title || 'Concerto',
        date: gig.date,
        timestamp: this.timestamp(gig.date),
        time: this.timeFromDate(gig.date),
        location: gig.venue?.name ?? null,
      })),
    ])
      .filter((event) => this.isUpcoming(event, today, now.getTime()))
      .sort((first, second) => first.timestamp - second.timestamp);
  }

  private isUpcoming(event: UpcomingBandEvent, today: Date, now: number): boolean {
    if (!event.timestamp) return false;
    const eventDay = new Date(event.timestamp);
    eventDay.setHours(0, 0, 0, 0);
    return eventDay >= today && event.timestamp >= now;
  }

  private timestamp(dateValue: string, timeValue?: string | null): number {
    const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return 0;

    const date = new Date(year, month - 1, day);
    if (timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
      date.setHours(hours, minutes, 0, 0);
    } else if (dateValue.includes('T')) {
      const parsed = new Date(dateValue);
      if (!Number.isFinite(parsed.getTime())) return 0;
      return parsed.getTime();
    }

    return date.getTime();
  }

  private timeFromDate(value: string): string | null {
    return value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? null;
  }

  private async prompt(bandEvents: BandEvents[], events: UpcomingBandEvent[]): Promise<void> {
    const bands = bandEvents.map(({ band }) => band);
    const modal = await this.overlays.create({
      component: UpcomingEventsOnboardingModalComponent,
      componentProps: { bands, events },
      boxCssClass: '!w-[calc(100%-1.5rem)] !max-w-5xl p-0',
    });
    await modal.present();
  }

  private async showLookupError(): Promise<void> {
    const toast = await this.toast.create({
      message: 'Non è stato possibile controllare le prove imminenti dei tuoi gruppi.',
      color: 'danger',
    });
    await toast.present();
  }
}
