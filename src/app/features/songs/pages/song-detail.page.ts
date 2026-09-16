
import { Component, Input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize, forkJoin, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';
import { addIcons } from 'ionicons';
import { close, musicalNotesOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  host: { class: 'ion-page' },
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './song-detail.page.html',
  styleUrls: ['./song-detail.page.scss'],
})
export class SongDetailPage implements OnInit {
  @Input() songId?: number;
  @Input() isModal = false;
  readonly song = signal<Song | null>(null);
  readonly linkedSongs = signal<Song[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  private id!: number;

  constructor(
    readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly songsApi: SongService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
    private readonly modalController: ModalController,
  ) {
    addIcons({ close, musicalNotesOutline });
  }

  ngOnInit(): void {
    this.id = this.songId ?? Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  close(): void {
    void this.modalController.dismiss();
  }

  edit(): void {
    if (this.isModal) {
      void this.modalController.dismiss({ id: this.id }, 'edit');
      return;
    }
    void this.router.navigate(['edit'], { relativeTo: this.route });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      song: this.songsApi.get(this.id),
      songs: this.songsApi.list(),
    }).pipe(
      timeout(15000),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ song, songs }) => {
        this.song.set(song);
        this.linkedSongs.set(song.linkGroup
          ? songs.filter((item) => item.linkGroup === song.linkGroup && item.id !== song.id)
          : []);
      },
      error: () => {
        this.song.set(null);
        this.linkedSongs.set([]);
        this.loadError.set('Impossibile caricare il brano.');
      },
    });
  }

  linkedSubtitle(song: Song): string {
    return [song.key, song.bpm ? `${song.bpm} bpm` : '', song.duration ? this.formatSeconds(song.duration) : '']
      .filter(Boolean)
      .join(' · ');
  }

  formatSeconds(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  formatTags(tags?: string[] | null): string {
    return tags?.length ? tags.join(', ') : '—';
  }

  statusLabel(status: Song['status']): string {
    return status === 'active' ? 'Attivo' : status === 'archived' ? 'Archiviato' : 'Bozza';
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare brano?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.songsApi.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Brano eliminato.', duration: 1800, color: 'success' })).present();
        if (this.isModal) {
          void this.modalController.dismiss({ id: this.id }, 'deleted');
        } else {
          void this.router.navigate(['..'], { relativeTo: this.route });
        }
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }
}
