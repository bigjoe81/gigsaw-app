
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonCheckbox, IonChip, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './song-link-groups.page.html',
  styles: ['.chips,.actions{display:flex;gap:8px;flex-wrap:wrap;padding:8px 0}'],
})
export class SongLinkGroupsPage implements OnInit {
  form = this.fb.nonNullable.group({
    linkGroup: '',
  });

  songs: Song[] = [];
  selectedIds: number[] = [];
  existingLinkGroups: string[] = [];
  saving = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly songsApi: SongService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.songsApi.list().subscribe({
      next: (songs) => {
        this.songs = songs;
        this.existingLinkGroups = Array.from(new Set(songs.map((item) => item.linkGroup).filter((group): group is string => !!group))).sort();
      },
      error: () => {
        this.error = 'Impossibile caricare i brani.';
      },
    });
  }

  toggleSong(songId: number): void {
    this.selectedIds = this.selectedIds.includes(songId)
      ? this.selectedIds.filter((id) => id !== songId)
      : [...this.selectedIds, songId];
  }

  subtitle(song: Song): string {
    return [song.linkGroup ? `Link: ${song.linkGroup}` : '', song.key, song.bpm ? `${song.bpm} bpm` : '']
      .filter(Boolean)
      .join(' · ') || 'Nessun gruppo';
  }

  applyLinkGroup(group: string): void {
    this.form.patchValue({ linkGroup: group });
  }

  apply(): void {
    const linkGroup = this.form.controls.linkGroup.value.trim();
    if (!linkGroup || !this.selectedIds.length || this.saving) {
      return;
    }

    this.save(linkGroup);
  }

  clear(): void {
    if (!this.selectedIds.length || this.saving) return;
    this.save(null);
  }

  private save(linkGroup: string | null): void {
    this.saving = true;
    this.error = '';

    const selectedSongs = this.songs.filter((song) => this.selectedIds.includes(song.id));
    forkJoin(
      selectedSongs.map((song) => this.songsApi.update(song.id, { ...song, linkGroup })),
    ).subscribe({
      next: async () => {
        this.saving = false;
        this.selectedIds = [];
        if (linkGroup === null) {
          this.form.patchValue({ linkGroup: '' });
        }
        this.load();
        (await this.toast.create({ message: 'Gruppo linkato aggiornato.', duration: 1800, color: 'success' })).present();
      },
      error: (error: Error) => {
        this.saving = false;
        this.error = error.message || 'Aggiornamento non riuscito.';
      },
    });
  }
}
