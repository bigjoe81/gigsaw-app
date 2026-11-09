import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { Component, OnInit, computed, signal } from '@angular/core';
import { WorkspaceTopbarComponent } from '../../../shared/ui/workspace-topbar.component';
import { workspaceRows } from '../../../shared/ui/workspace-table';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { GigService } from '../services/gig.service';
import { SetlistService } from '../../setlists/api';
import { Setlist } from '../../../core/models/band-resources.models';

type GigFilter = 'upcoming' | 'past' | 'all';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, WorkspaceTopbarComponent, RouterLink, ],
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
  readonly search = signal('');
  readonly rows = workspaceRows(this.visibleGigs, this.search,
    gig => [gig.title, this.venue(gig), this.fullDate(gig)].join(' '),
    gig => gig.date, computed(() => this.filter() === 'past'));
  readonly nextGig = computed(() => this.gigs().find(gig => this.isUpcoming(gig)));
  readonly upcomingCount = computed(() => this.gigs().filter((gig) => this.isUpcoming(gig)).length);

  readonly setlistsUnavailable = signal(false);

  constructor(private readonly gigsApi: GigService, private readonly setlistsApi: SetlistService) {

  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.loading.set(!event);
    this.error.set('');
    this.setlistsUnavailable.set(false);
    forkJoin({
      gigs: this.gigsApi.list().pipe(timeout(15000)),
      setlists: this.setlistsApi.list().pipe(timeout(10000), catchError(() => {
        this.setlistsUnavailable.set(true);
        return of([] as Setlist[]);
      })),
    }).pipe(
      finalize(() => {
        this.loading.set(false);
        event?.detail.complete();
      }),
    ).subscribe({
      next: ({ gigs, setlists }) => {
        const byGig = new Map<number, Array<{ id: number; title: string }>>();
        for (const list of setlists) {
          if (!list.gigId) continue;
          const id = Number(list.gigId);
          const links = byGig.get(id) ?? [];
          links.push({ id: list.id, title: list.title });
          byGig.set(id, links);
        }
        this.gigs.set(gigs.map(gig => ({
          ...gig, setlists: [...new Map([...(gig.setlists ?? []), ...(byGig.get(gig.id) ?? [])].map(list => [list.id, list])).values()],
        })).sort((left, right) => this.timestamp(left.date) - this.timestamp(right.date)));
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
    const date = this.dateValue(gig.date);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(date) : '—';
  }

  month(gig: Gig): string {
    const date = this.dateValue(gig.date);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(date).replace('.', '') : '';
  }

  fullDate(gig: Gig): string {
    const date = this.dateValue(gig.date);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date) : 'Data da definire';
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
