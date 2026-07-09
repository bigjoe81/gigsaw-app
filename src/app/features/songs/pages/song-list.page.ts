
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, gitNetwork } from 'ionicons/icons';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonText,
    IonTitle,
    IonToolbar
],
  templateUrl: './song-list.page.html',
  styles: ['.state{min-height:55%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}.state ion-icon{font-size:44px;color:var(--ion-color-medium)}'],
})
export class SongListPage implements OnInit {
  songs: Song[] = [];
  loading = true;
  error = '';

  constructor(private readonly songsApi: SongService) {
    addIcons({ add, alertCircle, gitNetwork });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.loading = !event;
    this.error = '';
    this.songsApi.list().subscribe({
      next: (songs) => {
        this.songs = songs;
        this.loading = false;
        event?.detail.complete();
      },
      error: (error: Error) => {
        this.error = error.message || 'Impossibile caricare i brani.';
        this.loading = false;
        event?.detail.complete();
      },
    });
  }

  subtitle(song: Song): string {
    return [
      song.status,
      song.album,
      song.linkGroup ? `Link: ${song.linkGroup}` : '',
      song.tags?.length ? `Tag: ${song.tags.join(', ')}` : '',
      song.bpm ? `${song.bpm} bpm` : '',
    ].filter(Boolean).join(' · ') || 'Apri dettagli';
  }
}
