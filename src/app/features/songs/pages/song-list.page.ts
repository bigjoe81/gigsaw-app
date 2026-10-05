
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonCheckbox,
  IonHeader,
  IonItem,
  IonLabel,
  IonMenuButton,
  ModalController,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { faPlus, faCircleExclamation, faChevronRight, faCloudArrowUp, faMusic, faTrash } from '@fortawesome/pro-light-svg-icons';
import { catchError, finalize, forkJoin, map, of, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';
import { SongDetailPage } from './song-detail.page';
import { GigsawIconComponent, GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    GigsawIconComponent,
    GigsawListComponent,
    GigsawListItemComponent,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonCheckbox,
    IonHeader,
      IonItem,
    IonLabel,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonText,
    IonTitle,
    IonToolbar
  ],
  templateUrl: './song-list.page.html',
  styleUrls: ['./song-list.page.scss'],
})
export class SongListPage {
  readonly icons = { add: faPlus, alert: faCircleExclamation, forward: faChevronRight, upload: faCloudArrowUp, music: faMusic, trash: faTrash };
  readonly importEnabled = false;
  readonly songs = signal<Song[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  readonly deleting = signal(false);
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allSelected = computed(() => this.songs().length > 0 && this.selectedCount() === this.songs().length);

  constructor(
    private readonly songsApi: SongService,
    private readonly modalController: ModalController,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
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

  subtitle(song: Song, includeAlbum = true): string {
    return [
      includeAlbum ? song.album : '',
      song.key ? `Tonalità: ${song.key}` : '',
      song.linkGroup ? `Link: ${song.linkGroup}` : '',
      song.tags?.length ? `Tag: ${song.tags.join(', ')}` : '',
      song.bpm ? `${song.bpm} bpm` : '',
    ].filter(Boolean).join(' · ') || 'Apri dettagli';
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
      await this.router.navigate([id, 'modifica'], { relativeTo: this.route });
    } else if (result.role === 'deleted') {
      this.load();
    }
  }
}
