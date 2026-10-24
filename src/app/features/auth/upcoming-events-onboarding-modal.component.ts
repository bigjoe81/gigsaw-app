import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BandContextService } from '../../core/services/band-context.service';
import { OverlayService, SymbolComponent } from '../../shared/ui/native-ui';
import { GigsawButtonComponent } from '../../shared/ui/gigsaw';
import { Band } from '../bands/models/band.models';

export type UpcomingEventType = 'rehearsal' | 'gig';

export interface UpcomingBandEvent {
  id: string;
  bandId: number;
  type: UpcomingEventType;
  eventId: number;
  title: string;
  date: string;
  timestamp: number;
  time?: string | null;
  location?: string | null;
}

@Component({
  selector: 'app-upcoming-events-onboarding-modal',
  standalone: true,
  imports: [SymbolComponent, GigsawButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-2xl bg-[var(--gigsaw-surface)] text-[var(--gigsaw-text)]">
      <header class="relative overflow-hidden bg-[linear-gradient(135deg,var(--ui-color-primary),var(--ui-color-secondary))] px-6 py-8 text-white sm:px-10 sm:py-10">
        <app-gigsaw-button
          tone="ghost"
          buttonClass="btn btn-circle btn-sm absolute right-4 top-4 text-white"
          aria-label="Chiudi"
          (click)="close()"
        >
          <app-symbol name="close" />
        </app-gigsaw-button>
        <p class="m-0 text-xs font-bold uppercase tracking-[0.2em] text-white/75">Il prossimo appuntamento</p>
        <h2 class="mb-0 mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">C'è qualcosa da preparare</h2>
        <p class="mb-0 mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
          Scegli la band e decidiamo insieme da dove iniziare.
        </p>
      </header>

      <div class="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] lg:gap-8">
        <div class="flex min-w-0 flex-col gap-5">
          <fieldset class="grid gap-3">
            <legend class="mb-1 text-sm font-semibold">Scegli la band</legend>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              @for (band of bands; track band.id) {
                <button
                  type="button"
                  class="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-solid p-4 text-left transition-all"
                  [class.border-[var(--ui-color-primary)]]="selectedBandId() === band.id"
                  [class.bg-[color-mix(in_srgb,var(--ui-color-primary)_8%,transparent)]]="selectedBandId() === band.id"
                  [class.shadow-sm]="selectedBandId() === band.id"
                  [class.border-[var(--gigsaw-border)]]="selectedBandId() !== band.id"
                  [attr.aria-pressed]="selectedBandId() === band.id"
                  (click)="selectBand(band.id)"
                >
                  <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--gigsaw-surface)] text-lg font-bold text-[var(--ui-color-primary)]">
                    {{ band.name.slice(0, 1).toLocaleUpperCase() }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold">{{ band.name }}</span>
                    <span class="mt-1 block text-xs text-[var(--gigsaw-muted)]">
                      @if (eventsForBand(band.id).length) {
                        {{ eventsForBand(band.id).length }} appuntamenti da preparare
                      } @else {
                        Nessun appuntamento futuro
                      }
                    </span>
                  </span>
                  @if (selectedBandId() === band.id) {
                    <app-symbol name="checkmark-circle-outline" class="text-xl text-[var(--ui-color-primary)]" />
                  }
                </button>
              }
            </div>
          </fieldset>

          @if (bandEvents().length > 1) {
            <fieldset class="grid gap-2">
              <legend class="mb-1 text-sm font-semibold">Su cosa lavoriamo?</legend>
              @for (event of bandEvents(); track event.id) {
                <button
                  type="button"
                  class="flex w-full items-start gap-3 rounded-xl border border-solid p-4 text-left transition-colors"
                  [class.border-[var(--ui-color-primary)]]="selectedEventId() === event.id"
                  [class.bg-[color-mix(in_srgb,var(--ui-color-primary)_8%,transparent)]]="selectedEventId() === event.id"
                  [class.border-[var(--gigsaw-border)]]="selectedEventId() !== event.id"
                  [attr.aria-pressed]="selectedEventId() === event.id"
                  (click)="selectEvent(event)"
                >
                  <app-symbol [name]="event.type === 'rehearsal' ? 'mic-outline' : 'ticket-outline'" class="mt-0.5 text-[var(--ui-color-primary)]" />
                  <span class="min-w-0">
                    <span class="block font-semibold">{{ eventHeading(event) }}</span>
                    <span class="mt-1 block text-xs text-[var(--gigsaw-muted)]">{{ event.title }}</span>
                  </span>
                </button>
              }
            </fieldset>
          }
        </div>

        @if (selectedEvent(); as event) {
          <article class="flex min-w-0 flex-col justify-between gap-6 rounded-2xl border border-solid border-[var(--gigsaw-border)] bg-[var(--gigsaw-input-background)] p-5 sm:p-6">
            <div>
              <span class="inline-flex items-center gap-2 rounded-full bg-[var(--gigsaw-surface)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ui-color-primary)]">
                <app-symbol [name]="event.type === 'rehearsal' ? 'mic-outline' : 'ticket-outline'" />
                {{ event.type === 'rehearsal' ? 'Prova' : 'Concerto' }}
              </span>
              <h3 class="mb-0 mt-5 text-2xl font-bold leading-tight">
                {{ event.type === 'rehearsal' ? 'Prepariamo la prova' : 'Prepariamo il concerto' }}
                <span class="text-[var(--ui-color-primary)]">del {{ dateLabel(event) }}</span>
              </h3>
              <p class="mb-0 mt-3 text-base leading-6 text-[var(--gigsaw-muted)]">
                con i <strong class="text-[var(--gigsaw-text)]">{{ selectedBand()?.name }}</strong>
              </p>
              @if (event.title || event.location || event.time) {
                <div class="mt-5 grid gap-2 text-sm text-[var(--gigsaw-muted)]">
                  @if (event.title) {
                    <p class="m-0 flex items-center gap-2"><app-symbol name="musical-notes-outline" />{{ event.title }}</p>
                  }
                  @if (event.time) {
                    <p class="m-0 flex items-center gap-2"><app-symbol name="time-outline" />{{ event.time.slice(0, 5) }}</p>
                  }
                  @if (event.location) {
                    <p class="m-0 flex items-center gap-2"><app-symbol name="location-outline" />{{ event.location }}</p>
                  }
                </div>
              }
            </div>

            <app-gigsaw-button
              tone="primary"
              buttonClass="w-full"
              (click)="prepare(event)"
            >
              {{ event.type === 'rehearsal' ? 'Prepariamo la prova' : 'Prepariamo il concerto' }}
              <app-symbol name="arrow-forward-outline" class="ml-2" />
            </app-gigsaw-button>
          </article>
        } @else {
          <div class="flex items-center rounded-2xl border border-solid border-[var(--gigsaw-border)] bg-[var(--gigsaw-input-background)] p-6 text-sm text-[var(--gigsaw-muted)]">
            Nessun appuntamento futuro per questa band. Puoi comunque aprire la sua bacheca.
          </div>
        }
      </div>

      <footer class="flex flex-wrap justify-end gap-3 border-0 border-t border-solid border-[var(--gigsaw-border)] px-5 py-4 sm:px-8">
        <app-gigsaw-button tone="ghost" buttonClass="w-full sm:w-auto" (click)="openBandBoard()">
          Apri bacheca band
        </app-gigsaw-button>
      </footer>
    </section>
  `,
})
export class UpcomingEventsOnboardingModalComponent {
  @Input() bands: Band[] = [];
  @Input() events: UpcomingBandEvent[] = [];

  private readonly overlay = inject(OverlayService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);
  readonly selectedBandId = signal(0);
  readonly selectedEventId = signal('');
  readonly bandEvents = computed(() => this.events.filter((event) => event.bandId === this.selectedBandId()));
  readonly selectedEvent = computed(() => this.bandEvents().find((event) => event.id === this.selectedEventId()) ?? this.bandEvents()[0] ?? null);
  readonly selectedBand = computed(() => this.bands.find((band) => band.id === this.selectedBandId()) ?? null);

  ngOnInit(): void {
    const firstEvent = this.events[0];
    const firstBandId = firstEvent?.bandId ?? this.bands[0]?.id ?? 0;
    this.selectBand(firstBandId);
  }

  selectBand(bandId: number): void {
    this.selectedBandId.set(bandId);
    this.selectedEventId.set(this.events.find((item) => item.bandId === bandId)?.id ?? '');
  }

  eventsForBand(bandId: number): UpcomingBandEvent[] {
    return this.events.filter((event) => event.bandId === bandId);
  }

  selectEvent(event: UpcomingBandEvent): void {
    this.selectedEventId.set(event.id);
  }

  eventHeading(event: UpcomingBandEvent): string {
    const article = event.type === 'rehearsal' ? 'Prova' : 'Concerto';
    return `${article} del ${this.dateLabel(event)}`;
  }

  dateLabel(event: UpcomingBandEvent): string {
    return new Date(event.timestamp).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
    });
  }

  prepare(event: UpcomingBandEvent): void {
    this.bandContext.setCurrentBand(event.bandId);
    void this.overlay.dismiss();
    const section = event.type === 'rehearsal' ? 'prove' : 'concerti';
    void this.router.navigateByUrl(`/band/${event.bandId}/${section}/${event.eventId}`);
  }

  openBandBoard(): void {
    const band = this.selectedBand();
    if (!band) return;
    this.bandContext.setCurrentBand(band.id);
    void this.overlay.dismiss();
    void this.router.navigateByUrl(`/band/${band.id}/panoramica`);
  }

  close(): void {
    void this.overlay.dismiss();
  }
}
