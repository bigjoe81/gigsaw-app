import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { add, calendarOutline, chevronBackOutline, chevronForwardOutline, micOutline, radioOutline } from 'ionicons/icons';
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
  location?: string | null;
  time?: string;
  status?: string;
  notes?: string | null;
}

interface CalendarDay {
  key: string;
  number: number;
  currentMonth: boolean;
  today: boolean;
  events: CalendarEvent[];
}

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './commitment-list.page.html',
  styleUrls: ['./commitment-list.page.scss'],
})
export class CommitmentListPage {
  private readonly gigsApi = inject(GigService);
  private readonly rehearsalsApi = inject(RehearsalSessionService);
  private readonly commitmentsApi = inject(CommitmentService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);

  readonly weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  readonly loading = signal(true);
  readonly gigs = signal<Gig[]>([]);
  readonly rehearsals = signal<RehearsalSession[]>([]);
  readonly commitments = signal<Commitment[]>([]);
  readonly selectedDate = signal<string | null>(null);
  readonly selectedEventKey = signal<string | null>(null);
  readonly selectedEvent = computed(() => this.events().find((item) => item.key === this.selectedEventKey()));
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonthIndex = signal(new Date().getMonth());

  readonly events = computed<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    for (const gig of this.gigs()) {
      events.push({
        key: `gig-${gig.id}`,
        source: 'gig',
        date: this.dateKey(gig.date),
        title: gig.title || 'Live',
        meta: ['Live', gig.venue?.name].filter((value): value is string => Boolean(value)).join(' · '),
        link: `${this.bandBaseUrl}/concerti/${gig.id}`,
        cancelled: false,
        location: [gig.venue?.name, gig.venue?.city, gig.venue?.address].filter(Boolean).join(' · '),
        notes: gig.notes,
      });
    }

    for (const rehearsal of this.rehearsals()) {
      events.push({
        key: `rehearsal-${rehearsal.id}`,
        source: 'rehearsal',
        date: this.dateKey(rehearsal.date),
        title: rehearsal.title || 'Prova',
        meta: ['Prova', rehearsal.rehearsalRoom?.name, this.timeRange(rehearsal.startTime, rehearsal.endTime)]
          .filter((value): value is string => Boolean(value))
          .join(' · '),
        link: `${this.bandBaseUrl}/prove/${rehearsal.id}`,
        cancelled: rehearsal.status === 'cancelled',
        location: [rehearsal.rehearsalRoom?.name, rehearsal.rehearsalRoom?.city].filter(Boolean).join(' · '),
        time: this.timeRange(rehearsal.startTime, rehearsal.endTime),
        status: this.statusLabel(rehearsal.status),
        notes: rehearsal.notes,
      });
    }

    for (const commitment of this.commitments()) {
      events.push({
        key: `commitment-${commitment.id}`,
        source: 'commitment',
        date: this.dateKey(commitment.date),
        title: commitment.title || this.typeLabel(commitment.type),
        meta: [this.typeLabel(commitment.type), commitment.location || '', this.timeRange(commitment.startTime, commitment.endTime)]
          .filter((value): value is string => Boolean(value))
          .join(' · '),
        link: `${this.bandBaseUrl}/impegni/${commitment.id}/modifica`,
        cancelled: commitment.status === 'cancelled',
        location: commitment.location,
        time: this.timeRange(commitment.startTime, commitment.endTime),
        status: this.statusLabel(commitment.status),
        notes: commitment.notes,
      });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonthIndex();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    const todayKey = this.dateKey(new Date());
    const result: CalendarDay[] = [];

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.dateKey(date);
      result.push({
        key,
        number: date.getDate(),
        currentMonth: date.getMonth() === month,
        today: key === todayKey,
        events: this.events().filter((event) => event.date === key),
      });
    }

    return result;
  });

  readonly agendaEvents = computed<CalendarEvent[]>(() => {
    const selected = this.selectedDate();
    if (selected) {
      return this.events().filter((event) => event.date === selected);
    }

    const year = this.viewYear();
    const month = this.viewMonthIndex();
    return this.events().filter((event) => {
      const date = this.parseDate(event.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  });

  constructor() {
    addIcons({ add, calendarOutline, chevronBackOutline, chevronForwardOutline, micOutline, radioOutline });
  }

  ionViewWillEnter(): void {
    this.selectedEventKey.set(null);
    this.load();
  }

  openEvent(event: MouseEvent, item: CalendarEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.matchMedia('(min-width: 1024px)').matches) {
      this.selectedEventKey.set(item.key);
    } else {
      void this.router.navigate([item.link], { queryParamsHandling: 'preserve' });
    }
  }

  private statusLabel(status: Commitment['status']): string {
    return { scheduled: 'Da confermare', confirmed: 'Confermato', completed: 'Completato', cancelled: 'Annullato' }[status];
  }

  get bandBaseUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}` : '/band';
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' })
      .format(new Date(this.viewYear(), this.viewMonthIndex(), 1));
  }

  get agendaTitle(): string {
    const selected = this.selectedDate();
    return selected ? this.formattedDate(selected) : this.monthLabel;
  }

  load(): void {
    this.loading.set(true);
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
    this.changeMonth(-1);
  }

  nextMonth(): void {
    this.changeMonth(1);
  }

  goToday(): void {
    this.selectedEventKey.set(null);
    const today = new Date();
    this.viewYear.set(today.getFullYear());
    this.viewMonthIndex.set(today.getMonth());
    this.selectedDate.set(this.dateKey(today));
  }

  selectDay(day: CalendarDay): void {
    this.selectedEventKey.set(null);
    this.selectedDate.set(this.selectedDate() === day.key ? null : day.key);
    if (!day.currentMonth) {
      const target = this.parseDate(day.key);
      this.viewYear.set(target.getFullYear());
      this.viewMonthIndex.set(target.getMonth());
    }
  }

  visibleDayEvents(day: CalendarDay): CalendarEvent[] {
    return day.events.slice(0, 3);
  }

  clearSelectedDate(): void {
    this.selectedDate.set(null);
  }

  eventIcon(source: CalendarSource): string {
    if (source === 'gig') return 'radio-outline';
    if (source === 'rehearsal') return 'mic-outline';
    return 'calendar-outline';
  }

  eventSourceLabel(source: CalendarSource): string {
    if (source === 'gig') return 'Live';
    if (source === 'rehearsal') return 'Prova';
    return 'Impegno';
  }

  formattedDate(date: string): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }).format(this.parseDate(date));
  }

  private changeMonth(delta: number): void {
    this.selectedEventKey.set(null);
    const date = new Date(this.viewYear(), this.viewMonthIndex() + delta, 1);
    this.viewYear.set(date.getFullYear());
    this.viewMonthIndex.set(date.getMonth());
    this.selectedDate.set(null);
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
    const values = [start, end].filter((value): value is string => Boolean(value)).map((value) => value.slice(0, 5));
    return values.join(' – ');
  }

  private dateKey(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return value.slice(0, 10);
  }

  private parseDate(value: string): Date {
    return new Date(`${this.dateKey(value)}T00:00:00`);
  }
}
