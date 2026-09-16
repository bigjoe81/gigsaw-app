import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, calendarClearOutline, locationOutline, timeOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { GigService } from '../services/gig.service';

type GigFilter = 'upcoming' | 'past' | 'all';

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonRefresher, IonRefresherContent, IonSkeletonText, IonText, IonTitle, IonToolbar],
  templateUrl: './gig-list.page.html',
  styleUrl: './gig-list.page.scss',
})
export class GigListPage implements OnInit {
  readonly gigs = signal<Gig[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filter = signal<GigFilter>('upcoming');
  readonly visibleGigs = computed(() => {
    const filter = this.filter();
    if (filter === 'all') return this.gigs();
    return this.gigs().filter((gig) => filter === 'upcoming' ? this.isUpcoming(gig) : !this.isUpcoming(gig));
  });
  readonly upcomingCount = computed(() => this.gigs().filter((gig) => this.isUpcoming(gig)).length);

  constructor(private readonly gigsApi: GigService) {
    addIcons({ add, alertCircleOutline, calendarClearOutline, locationOutline, timeOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.loading.set(!event);
    this.error.set('');
    this.gigsApi.list().pipe(
      finalize(() => {
        this.loading.set(false);
        event?.detail.complete();
      }),
    ).subscribe({
      next: (gigs) => {
        this.gigs.set([...gigs].sort((left, right) => this.timestamp(left.date) - this.timestamp(right.date)));
      },
      error: (error: Error) => {
        this.error.set(error.message || 'Impossibile caricare i concerti.');
      },
    });
  }

  setFilter(filter: GigFilter): void {
    this.filter.set(filter);
  }

  isUpcoming(gig: Gig): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.timestamp(gig.date) >= today.getTime();
  }

  day(gig: Gig): string {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(this.dateValue(gig.date));
  }

  month(gig: Gig): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(this.dateValue(gig.date)).replace('.', '');
  }

  fullDate(gig: Gig): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.dateValue(gig.date));
  }

  time(gig: Gig): string | null {
    return gig.date.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? null;
  }

  venue(gig: Gig): string {
    return gig.venue?.name || 'Venue da definire';
  }

  private timestamp(value: string): number {
    const timestamp = this.dateValue(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private dateValue(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
  }
}
