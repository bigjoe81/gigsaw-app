import { WorkspaceTopbarComponent } from '../../../shared/ui/workspace-topbar.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { RehearsalSessionService } from '../services/rehearsal-session.service';

@Component({
  host: { class: 'backstage-page' },
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [WorkspaceTopbarComponent, NativeUiModule, RouterLink],
  templateUrl: './rehearsal-session-list.page.html',
  styleUrls: ['./rehearsal-session-list.page.scss'],
})
export class RehearsalSessionListPage {
  readonly sessions = signal<RehearsalSession[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal('');
  readonly view = signal<'upcoming' | 'past'>('upcoming');
  readonly selectedDate = signal('');
  readonly month = signal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  readonly weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  readonly upcomingSessions = computed(() =>
    this.sessions().filter((session) => !this.isPast(session)),
  );
  readonly pastSessions = computed(() =>
    this.sessions()
      .filter((session) => this.isPast(session))
      .slice()
      .reverse(),
  );
  readonly filteredSessions = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('it');
    return (
      this.view() === 'upcoming' ? this.upcomingSessions() : this.pastSessions()
    ).filter(
      (session) =>
        (!this.selectedDate() ||
          session.date.slice(0, 10) === this.selectedDate()) &&
        (!query ||
          `${session.title || ''} ${session.rehearsalRoom?.name || ''} ${session.rehearsalRoom?.city || ''}`
            .toLocaleLowerCase('it')
            .includes(query)),
    );
  });
  readonly nextSession = computed(() => this.upcomingSessions()[0]);
  readonly monthLabel = computed(() =>
    this.month().toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    }),
  );
  readonly calendarDays = computed(() => {
    const month = this.month();
    const offset = (month.getDay() + 6) % 7;
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    const length = Math.ceil((offset + count) / 7) * 7;
    return Array.from({ length }, (_, index) => {
      const day = index - offset + 1;
      if (day < 1 || day > count) return null;
      const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        day,
        date,
        today: date === this.todayKey(),
        count: this.sessions().filter(
          (session) =>
            session.date.slice(0, 10) === date &&
            session.status !== 'cancelled',
        ).length,
      };
    });
  });
  constructor(private readonly api: RehearsalSessionService) {}
  ngOnInit(): void {
    this.load();
  }
  load(event?: CustomEvent): void {
    if (!event) this.loading.set(true);
    this.error.set('');
    this.api
      .list()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading.set(false);
          event?.detail.complete();
        }),
      )
      .subscribe({
        next: (sessions) =>
          this.sessions.set(
            [...sessions].sort((a, b) =>
              (a.date.slice(0, 10) + (a.startTime || '')).localeCompare(
                b.date.slice(0, 10) + (b.startTime || ''),
              ),
            ),
          ),
        error: (error: Error) =>
          this.error.set(error.message || 'Impossibile caricare le prove.'),
      });
  }
  isPast(session: RehearsalSession): boolean {
    if (session.status === 'completed' || session.status === 'cancelled')
      return true;
    const date = session.date.slice(0, 10);
    return (
      date < this.todayKey() ||
      (date === this.todayKey() &&
        !!session.endTime &&
        session.endTime.slice(0, 5) < new Date().toTimeString().slice(0, 5))
    );
  }
  todayKey(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  datePart(date: string, part: 'day' | 'month' | 'weekday'): string {
    const value = new Date(`${date.slice(0, 10)}T12:00:00`);
    if (!Number.isFinite(value.getTime())) return '—';
    return value.toLocaleDateString(
      'it-IT',
      part === 'day'
        ? { day: 'numeric' }
        : part === 'month'
          ? { month: 'short' }
          : { weekday: 'long' },
    );
  }
  formatDate(date?: string | null): string {
    const value = date ? new Date(`${date.slice(0, 10)}T12:00:00`) : null;
    return value && Number.isFinite(value.getTime())
      ? value.toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : 'Data da definire';
  }
  time(session: RehearsalSession): string {
    return (
      [session.startTime, session.endTime]
        .filter(Boolean)
        .map((value) => String(value).slice(0, 5))
        .join(' – ') || 'Orario da definire'
    );
  }
  songCount(session: RehearsalSession): number {
    return session.songs?.length || session.songIds?.length || 0;
  }
  statusLabel(session: RehearsalSession): string {
    return (
      {
        scheduled: 'Da confermare',
        confirmed: 'Confermata',
        completed: 'Completata',
        cancelled: 'Annullata',
      }[session.status] || 'Da confermare'
    );
  }
  changeMonth(delta: number): void {
    const current = this.month();
    this.month.set(
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }
  selectDate(date: string): void {
    if (this.selectedDate() === date) {
      this.selectedDate.set('');
      return;
    }
    this.selectedDate.set(date);
    const matching = this.sessions().filter(
      (session) => session.date.slice(0, 10) === date,
    );
    this.view.set(
      (
        matching.length
          ? matching.some((session) => !this.isPast(session))
          : date >= this.todayKey()
      )
        ? 'upcoming'
        : 'past',
    );
  }
}
