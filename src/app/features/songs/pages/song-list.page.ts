
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  ModalController,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, chevronForward, gitNetwork, musicalNotesOutline } from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';
import { SongDetailPage } from './song-detail.page';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
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
export class SongListPage implements OnInit {
  readonly songs = signal<Song[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(
    private readonly songsApi: SongService,
    private readonly modalController: ModalController,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    addIcons({ add, alertCircle, chevronForward, gitNetwork, musicalNotesOutline });
  }

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
      },
      error: (error: Error) => {
        this.error.set(error.message || 'Impossibile caricare i brani.');
      },
    });
  }

  subtitle(song: Song): string {
    return [
      song.album,
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
