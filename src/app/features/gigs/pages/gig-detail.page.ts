import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { DialogService, ToastService } from '../../../shared/ui/native-ui';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Gig, Setlist } from '../../../core/models/band-resources.models';
import { GigPostersComponent, GigPosterValues } from '../../poster-templates/components/gig-posters.component';
import { SetlistService } from '../../setlists/services/setlist.service';
import { GigService } from '../services/gig.service';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, GigPostersComponent, RouterLink, ],
  templateUrl: './gig-detail.page.html',
  styleUrl: './gig-detail.page.scss',
})
export class GigDetailPage implements OnInit {
  readonly gig = signal<Gig | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly setlists = signal<Array<{ id: number; title: string; detail?: Setlist }>>([]);
  readonly setlistsLoading = signal(false);
  readonly setlistsError = signal('');
  private id!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gigsApi: GigService,
    private readonly setlistsApi: SetlistService,
    private readonly alert: DialogService,
    private readonly toast: ToastService,
  ) {

  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.gigsApi.get(this.id).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (gig) => { this.gig.set(gig); this.loadSetlists(); },
      error: () => this.error.set('Impossibile caricare il concerto.'),
    });
  }

  loadSetlists(): void {
    if (this.setlistsLoading()) return;
    this.setlistsError.set('');
    this.setlistsLoading.set(true);
    this.setlistsApi.list().pipe(
      switchMap(setlists => {
        const linked = setlists.filter(setlist => Number(setlist.gigId) === this.id);
        this.setlists.set(linked);
        if (!linked.length) return of([]);
        return forkJoin(linked.map(summary => this.setlistsApi.get(summary.id).pipe(
          catchError(() => {
            this.setlistsError.set('Alcune scalette non sono disponibili. Puoi riprovare o aprirle dal collegamento.');
            return of(undefined);
          }),
        ))).pipe(
          map(details => linked.map((summary, index) => ({ ...summary, detail: details[index] }))),
        );
      }),
      finalize(() => this.setlistsLoading.set(false)),
    ).subscribe({
      next: setlists => this.setlists.set(setlists),
      error: () => this.setlistsError.set('Impossibile caricare le scalette del concerto. Riprova.'),
    });
  }

  setlistSections(setlist: Setlist): Array<{ name: string; titles: string[] }> {
    const songs = setlist.songs ?? setlist.songEntries ?? [];
    const title = (id: number) => songs.find(song => song.id === id)?.title ?? `Brano #${id}`;
    if (setlist.items?.length) {
      return setlist.items.map(section => ({
        name: section.name,
        titles: section.items.map(item => item.type === 'song'
          ? (item.songId ? title(item.songId) : item.title)
          : `${item.type === 'pause' ? 'Pausa' : item.type === 'speech' ? 'Parlato' : 'Nota palco'}: ${item.title}`),
      }));
    }
    if (setlist.sections?.length) {
      return setlist.sections.map(section => ({ name: section.name, titles: section.songIds.map(title) }));
    }
    const generation = setlist.generation;
    const opening = generation?.openingSongIds ?? [];
    const closing = generation?.closingSongIds ?? [];
    const encore = setlist.encoreSongIds ?? generation?.encoreSongIds ?? [];
    const reserved = new Set([...opening, ...closing, ...encore]);
    const ids = setlist.songIds ?? songs.map(song => song.id);
    return [
      { name: 'Apertura', titles: opening.map(title) },
      { name: 'Brani', titles: ids.filter(id => !reserved.has(id)).map(title) },
      { name: 'Chiusura', titles: closing.map(title) },
      { name: 'Bis', titles: encore.map(title) },
    ].filter(section => section.titles.length);
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.dateValue(value));
  }

  time(value: string): string | null {
    return value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? null;
  }

  venueAddress(gig: Gig): string {
    return [gig.venue?.address, gig.venue?.city].filter(Boolean).join(' · ');
  }

  get posterBandId(): string {
    let route: ActivatedRoute | null = this.route;
    while (route) {
      const id = route.snapshot.paramMap.get('bandId');
      if (id) return id;
      route = route.parent;
    }
    return String(this.gig()?.bandId ?? '');
  }

  get posterValues(): GigPosterValues {
    const gig = this.gig();
    return { title: gig?.title ?? '', date: gig?.date.slice(0, 10) ?? '', time: gig ? this.time(gig.date) ?? '' : '',
      venue: gig?.venue?.name ?? '', city: gig?.venue?.city ?? '', address: gig?.venue?.address ?? '', admission: '' };
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare il concerto?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.gigsApi.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto eliminato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private dateValue(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
  }
}
