import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  cameraOutline,
  chevronBackOutline,
  chevronForwardOutline,
  micOutline,
  radioOutline,
} from 'ionicons/icons';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Commitment, Gig, RehearsalSession } from '../../../core/models/band-resources.models';
import { BandContextService } from '../../../core/services/band-context.service';
import { GigService } from '../../gigs/services/gig.service';
import { RehearsalSessionService } from '../../rehearsal-sessions/services/rehearsal-session.service';
import { CommitmentService } from '../services/commitment.service';

type CalendarSource = 'gig' | 'rehearsal' | 'commitment';

interface CalendarEvent {
  key: string;
  source: CalendarSource;
  date: string;
  title: string;
  meta: string;
  link: string;
  cancelled: boolean;
}

interface CalendarDay {
  key: string;
  day: number;
  currentMonth: boolean;
  today: boolean;
  events: CalendarEvent[];
}

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './commitment-list.page.html',
  styleUrls: ['./commitment-list.page.scss'],
})
export class CommitmentListPage {
  private readonly gigsApi = inject(GigService);
  private readonly rehearsalsApi = inject(RehearsalSessionService);
  private readonly commitmentsApi = inject(CommitmentService);
  private readonly bandContext = inject(BandContextService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly gigs = signal<Gig[]>([]);
  readonly rehearsals = signal<RehearsalSession[]>([]);
  readonly commitments = signal<Commitment[]>([]);
  readonly viewMonth = signal(this.monthStart(new Date()));
  readonly selectedDate = signal<string | null>(null);

  readonly events = computed<CalendarEvent[]>(() => [
    ...this.gigs().map((gig) => ({
      key: `gig-${gig.id}`,
      source: 'gig' as const,
      date: this.dateKey(gig.date),
      title: gig.title || 'Live',
      meta: ['Live', gig.venue?.name].filter(Boolean).join(' · '),
      link: `${this.bandBaseUrl}/concerti/${gig.id}`,
      cancelled: false,
    })),
    ...this.rehearsals().map((rehearsal) => ({
      key: `rehearsal-${rehearsal.id}`,
      source: 'rehearsal' as const,
      date: this.dateKey(rehearsal.date),
      title: rehearsal.title || 'Prova',
      meta: ['Prova', rehearsal.rehearsalRoom?.name, this.timeRange(rehearsal.startTime, rehearsal.endTime)].filter(Boolean).join(' · '),
      link: `${this.bandBaseUrl}/prove/${rehearsal.id}`,
      cancelled: rehearsal.status === 'cancelled',
    })),
    ...this.commitments().map((commitment) => ({
      key: `commitment-${commitment.id}`,
      source: 'commitment' as const,
      date: this.dateKey(commitment.date),
      title: commitment.title,
      meta: [this.typeLabel(commitment.type), commitment.location, this.timeRange(commitment.startTime, commitment.endTime)].filter(Boolean).join(' · '),
      link: `${this.bandBaseUrl}/impegni/${commitment.id}/modifica`,
      cancelled: commitment.status === 'cancelled',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)));

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.viewMonth();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    const today = this.dateKey(new Date());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.dateKey(date);
      return {
        key,
        day: date.getDate(),
        currentMonth: date.getMonth() === month.getMonth(),
        today: key === today,
        events: this.events().filter((event) => event.date === key),
      };
    });
  });

  readonly agendaEvents = computed(() => {
    const selected = this.selectedDate();
    if (selected) return this.events().filter((event) => event.date === selected);
    const month = this.viewMonth();
    return this.events().filter((event) => {
      const date = this.parseDate(event.date);
      return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
    });
  });

  constructor() {
    addIcons({ add, calendarOutline, cameraOutline, chevronBackOutline, chevronForwardOutline, micOutline, radioOutline });
  }

  ionViewWillEnter(): void {
    this.load();
  }

  get bandBaseUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}` : '/band';
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(this.viewMonth());
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      gigs: this.gigsApi.list().pipe(catchError(() => of([] as Gig[]))),
      rehearsals: this.rehearsalsApi.list().pipe(catchError(() => of([] as RehearsalSession[]))),
      commitments: this.commitmentsApi.list().pipe(catchError(() => of([] as Commitment[]))),
    }).pipe(finalize(() => this.loading.set(false))).subscribe(({ gigs, rehearsals, commitments }) => {
      this.gigs.set(gigs);
      this.rehearsals.set(rehearsals);
      this.commitments.set(commitments);
    });
  }

  previousMonth(): void {
    const current = this.viewMonth();
    this.viewMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.selectedDate.set(null);
  }

  nextMonth(): void {
    const current = this.viewMonth();
    this.viewMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.selectedDate.set(null);
  }

  today(): void {
    this.viewMonth.set(this.monthStart(new Date()));
    this.selectedDate.set(this.dateKey(new Date()));
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.update((selected) => selected === day.key ? null : day.key);
    if (!day.currentMonth) {
      const date = this.parseDate(day.key);
      this.viewMonth.set(this.monthStart(date));
    }
  }

  eventIcon(source: CalendarSource): string {
    return source === 'gig' ? 'radio-outline' : source === 'rehearsal' ? 'mic-outline' : 'calendar-outline';
  }

  eventSourceLabel(source: CalendarSource): string {
    return source === 'gig' ? 'Live' : source === 'rehearsal' ? 'Prova' : 'Impegno';
  }

  formattedDate(date: string): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }).format(this.parseDate(date));
  }

  private typeLabel(type: Commitment['type']): string {
    const labels: Record<Commitment['type'], string> = {
      photo_shoot: 'Shoot fotografico',
      recording: 'Registrazione',
      interview: 'Intervista',
      meeting: 'Riunione',
      travel: 'Trasferta',
      promo: 'Promo',
      other: 'Altro',
    };
    return labels[type];
  }

  private timeRange(start?: string | null, end?: string | null): string {
    const values = [start, end].filter(Boolean).map((value) => String(value).slice(0, 5));
    return values.length ? values.join(' – ') : '';
  }

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private dateKey(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }

  private parseDate(value: string): Date {
    return new Date(`${this.dateKey(value)}T00:00:00`);
  }
}
