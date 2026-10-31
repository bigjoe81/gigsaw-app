import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { OverlayService, DialogService, ToastService } from '../../../shared/ui/native-ui';

import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { faPlus, faCircleExclamation, faChevronRight, faCloudArrowUp, faMusic, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { catchError, concatMap, finalize, forkJoin, from, map, of, Subscription, switchMap, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';
import { SongMetadataDetail } from '../models/song.models';
import { SongDetailPage } from './song-detail.page';
import { GigsawIconComponent, GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, GigsawFormControlsModule,
    RouterLink,
    GigsawIconComponent,
    GigsawListComponent,
    GigsawListItemComponent,
  ],
  templateUrl: './song-list.page.html',
  styleUrls: ['./song-list.page.scss'],
})
export class SongListPage {
  readonly icons = { 
    add: faPlus, 
    alert: faCircleExclamation, 
    forward: faChevronRight, 
    upload: faCloudArrowUp, 
    music: faMusic,
    trash: faTrash,
    import: faCloudArrowUp
  };
  readonly importEnabled = false;
  readonly songs = signal<Song[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  readonly deleting = signal(false);
  readonly enriching = signal(false);
  readonly enrichProgress = signal({ done: 0, total: 0 });
  private enrichSub?: Subscription;
  readonly incompleteSongs = computed(() => this.songs().filter((song) => this.needsMetadata(song)));
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allSelected = computed(() => this.songs().length > 0 && this.selectedCount() === this.songs().length);

  constructor(
    private readonly songsApi: SongService,
    private readonly modalController: OverlayService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly alertController: DialogService,
    private readonly toastController: ToastService,
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    if (!event) this.loading.set(true);
    this.error.set('');
    this.songsApi.list().pipe(
      timeout(15000),
      finalize(() => {
        this.loading.set(false);
        event?.detail.complete();
      }),
    ).subscribe({
      next: (songs) => {
        this.songs.set(songs);
        const availableIds = new Set(songs.map((song) => song.id));
        this.selectedIds.update((selected) => new Set([...selected].filter((id) => availableIds.has(id))));
      },
      error: (error: Error) => {
        this.error.set(error.message || 'Impossibile caricare i brani.');
      },
    });
  }

  toggleSong(id: number, checked: boolean): void {
    this.selectedIds.update((selected) => {
      const next = new Set(selected);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.songs().map((song) => song.id)) : new Set());
  }

  async confirmDeleteSelected(): Promise<void> {
    const count = this.selectedCount();
    if (!count || this.deleting()) return;

    const dialog = await this.alertController.create({
      header: count === 1 ? 'Eliminare il brano?' : `Eliminare ${count} brani?`,
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.deleteSelected() },
      ],
    });
    await dialog.present();
  }

  private deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;

    this.deleting.set(true);
    forkJoin(ids.map((id) => this.songsApi.delete(id).pipe(
      map(() => ({ id, deleted: true })),
      catchError(() => of({ id, deleted: false })),
    ))).pipe(finalize(() => this.deleting.set(false))).subscribe(async (results) => {
      const deletedIds = new Set(results.filter((result) => result.deleted).map((result) => result.id));
      const failed = results.length - deletedIds.size;
      this.songs.update((songs) => songs.filter((song) => !deletedIds.has(song.id)));
      this.selectedIds.set(new Set(results.filter((result) => !result.deleted).map((result) => result.id)));

      const message = failed
        ? `${deletedIds.size} eliminati, ${failed} non eliminati.`
        : deletedIds.size === 1 ? 'Brano eliminato.' : `${deletedIds.size} brani eliminati.`;
      (await this.toastController.create({
        message,
        duration: failed ? 2600 : 1800,
        color: failed ? 'warning' : 'success',
      })).present();
    });
  }

  needsMetadata(song: Song): boolean {
    return !song.duration || !song.album?.trim() || !song.bpm || !song.musicBy?.trim() || !song.lyricsBy?.trim();
  }

  stopEnrichment(): void {
    this.enrichSub?.unsubscribe();
  }

  startEnrichment(): void {
    const targets = this.incompleteSongs();
    if (!targets.length || this.enriching()) return;

    let updated = 0;
    let notFound = 0;
    let failed = 0;
    this.enriching.set(true);
    this.enrichProgress.set({ done: 0, total: targets.length });

    this.enrichSub = from(targets).pipe(
      concatMap((song) => this.enrichSong(song).pipe(
        map((result) => ({ song, result })),
        finalize(() => this.enrichProgress.update((progress) => ({ ...progress, done: progress.done + 1 }))),
      )),
      finalize(async () => {
        this.enriching.set(false);
        const parts = [`${updated} aggiornati`];
        if (notFound) parts.push(`${notFound} senza corrispondenza`);
        if (failed) parts.push(`${failed} in errore`);
        (await this.toastController.create({ message: parts.join(', ') + '.', duration: 4000, color: failed ? 'warning' : 'success' })).present();
      }),
    ).subscribe(({ song, result }) => {
      if (result === 'not_found') notFound++;
      else if (result === 'error') failed++;
      else {
        updated++;
        this.songs.update((songs) => songs.map((item) => item.id === song.id ? result : item));
      }
    });
  }

  private enrichSong(song: Song) {
    const norm = (value?: string | null) => (value ?? '').toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const sameTitle = (candidate: { title: string; artist?: string | null }) =>
      norm(candidate.title) === norm(song.title)
      && (!song.performedBy || !candidate.artist || norm(candidate.artist).includes(norm(song.performedBy)) || norm(song.performedBy).includes(norm(candidate.artist)));

    return this.songsApi.searchMetadata(song.title, song.performedBy ?? undefined).pipe(
      switchMap((candidates) => {
        const match = candidates.find((candidate) => sameTitle(candidate) && (candidate.durationSeconds ?? 0) > 0)
          ?? candidates.find(sameTitle);
        if (!match) return of('not_found' as const);

        const needsDetail = match.recordingMbid && (!song.bpm || !song.musicBy?.trim() || !song.lyricsBy?.trim());
        const detail$ = needsDetail
          ? this.songsApi.metadataDetail(match.recordingMbid as string).pipe(catchError(() => of(null)))
          : of(null);

        return detail$.pipe(switchMap((detail) => {
          const info = { ...match, ...(detail ?? {}) } as SongMetadataDetail;
          const credits = (roles: string[]) => Array.from(new Set((info.credits ?? [])
            .filter((credit) => roles.includes(credit.role.toLowerCase())).map((credit) => credit.name))).join(', ');
          const patch: Partial<Song> = {
            duration: song.duration || info.durationSeconds || 0,
            album: song.album?.trim() ? song.album : info.album ?? '',
            bpm: song.bpm || info.bpm || null,
            musicBy: song.musicBy?.trim() ? song.musicBy : credits(['composer', 'writer']),
            lyricsBy: song.lyricsBy?.trim() ? song.lyricsBy : (credits(['lyricist']) || credits(['writer'])),
          };
          const changed = (['duration', 'album', 'bpm', 'musicBy', 'lyricsBy'] as const)
            .some((key) => (patch[key] || null) !== (song[key] || null));
          if (!changed) return of('not_found' as const);

          return this.songsApi.update(song.id, {
            title: song.title,
            performedBy: song.performedBy,
            key: song.key,
            status: song.status,
            notes: song.notes,
            referenceUrl: song.referenceUrl,
            linkGroup: song.linkGroup,
            tags: song.tags ?? [],
            ...patch,
          }).pipe(map((saved) => ({ ...song, ...patch, ...(saved ?? {}) }) as Song));
        }));
      }),
      catchError(() => of('error' as const)),
    );
  }

  subtitle(song: Song, includeAlbum = true): string {
    return [
      includeAlbum ? song.album : '',
      song.key ? `Tonalità: ${song.key}` : '',
      song.linkGroup ? `Link: ${song.linkGroup}` : '',
      song.tags?.length ? `Tag: ${song.tags.join(', ')}` : '',
      song.bpm ? `${song.bpm} bpm` : '',
    ].filter(Boolean).join(' · ') || 'Apri dettagli';
  }

  missingFields(song: Song): string[] {
    const missing: string[] = [];
    if (!song.title?.trim()) missing.push('titolo');
    if (!song.key?.trim()) missing.push('tonalità');
    if (!song.duration) missing.push('durata');
    return missing;
  }

  statusLabel(status: Song['status']): string {
    return status === 'active' ? 'Attivo' : status === 'archived' ? 'Archiviato' : 'Bozza';
  }

  async openSong(id: number): Promise<void> {
    const modal = await this.modalController.create({
      component: SongDetailPage,
      componentProps: { songId: id, isModal: true },
      cssClass: 'song-detail-modal',
    });
    await modal.present();

    const result = await modal.onDidDismiss<{ id: number }>();
    if (result.role === 'edit') {
      await this.router.navigate([id, 'modifica'], { relativeTo: this.route, queryParamsHandling: 'preserve' });
    } else if (result.role === 'deleted') {
      this.load();
    }
  }
}
