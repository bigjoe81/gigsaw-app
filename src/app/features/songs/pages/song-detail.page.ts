
import { Component, OnInit } from '@angular/core';
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
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './song-detail.page.html',
})
export class SongDetailPage implements OnInit {
  song?: Song;
  linkedSongs: Song[] = [];
  loading = true;
  private id!: number;

  constructor(
    readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly songsApi: SongService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      song: this.songsApi.get(this.id),
      songs: this.songsApi.list(),
    }).subscribe({
      next: ({ song, songs }) => {
        this.song = song;
        this.linkedSongs = song.linkGroup
          ? songs.filter((item) => item.linkGroup === song.linkGroup && item.id !== song.id)
          : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
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
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }
}
