import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { Component, OnInit, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { GigService } from '../services/gig.service';
import { SetlistService } from '../../setlists/api';
import { Setlist } from '../../../core/models/band-resources.models';

type GigFilter = 'upcoming' | 'past' | 'all';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, NgClass, RouterLink, ],
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

  readonly viewedSetlist = signal<Setlist | null>(null);
  readonly setlistLoading = signal(false);
  readonly viewedSections = computed(() => {
    const setlist = this.viewedSetlist();
    if (!setlist) return [];
    const titles = new Map((setlist.songs ?? []).map((song) => [song.id, song.title]));
    const sections = setlist.items?.length
      ? setlist.items.map((section) => ({ name: section.name, entries: section.items.map((item) => item.type === 'song' ? (item.title || titles.get(item.songId ?? 0) || '') : (item.title || item.type)) }))
      : (setlist.sections ?? []).map((section) => ({ name: section.name, entries: section.songIds.map((id) => titles.get(id) ?? '') }));
    return sections.map((section) => ({ name: section.name, lines: section.entries.filter(Boolean).map((entry, index) => `${index + 1}. ${entry}`) }));
  });

  constructor(private readonly gigsApi: GigService, private readonly setlistsApi: SetlistService) {

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

  openSetlist(event: Event, id: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.setlistLoading.set(true);
    this.setlistsApi.get(id).pipe(finalize(() => this.setlistLoading.set(false))).subscribe({
      next: (setlist) => this.viewedSetlist.set(setlist),
      error: (error: Error) => this.error.set(error.message || 'Impossibile caricare la scaletta.'),
    });
  }
  closeSetlist(): void { this.viewedSetlist.set(null); this.setlistLoading.set(false); }
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
