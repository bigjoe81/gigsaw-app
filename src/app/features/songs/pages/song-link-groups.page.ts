
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonReorder,
  IonReorderGroup,
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
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonReorder, IonReorderGroup, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './song-link-groups.page.html',
  styleUrls: ['./song-link-groups.page.scss'],
})
export class SongLinkGroupsPage implements OnInit {
  form = this.fb.nonNullable.group({
    linkGroup: '',
  });

  readonly songs = signal<Song[]>([]);
  selectedIds: number[] = [];
  existingLinkGroups: string[] = [];
  saving = false;
  error = '';
  expandedGroup = '';
  readonly editingGroup = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly songsApi: SongService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
    private readonly alert: AlertController,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.songsApi.list().subscribe({
      next: (songs) => {
        this.songs.set(songs);
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

  readonly groupedSongs = computed(() => {
    const groups = Array.from(new Set(this.songs().map((song) => song.linkGroup).filter((group): group is string => !!group))).sort();
    return groups.map((name) => ({ name, songs: this.orderedSongs(name) }));
  });

  get matchingGroups(): string[] {
    const query = this.form.controls.linkGroup.value.trim().toLocaleLowerCase();
    return query ? this.existingLinkGroups.filter((group) => group.toLocaleLowerCase().includes(query)) : [];
  }

  orderedSongs(group: string): Song[] {
    const songs = this.songs().filter((song) => song.linkGroup === group);
    const saved = this.savedOrder(group);
    return [...songs].sort((a, b) => (saved.indexOf(a.id) < 0 ? 9999 : saved.indexOf(a.id)) - (saved.indexOf(b.id) < 0 ? 9999 : saved.indexOf(b.id)));
  }

  toggleGroup(group: string): void {
    this.expandedGroup = this.expandedGroup === group ? '' : group;
  }

  editGroupSongs(group: string): void {
    this.form.patchValue({ linkGroup: group });
    this.editingGroup.set(group);
    this.selectedIds = this.songs().filter((song) => song.linkGroup === group).map((song) => song.id);
    this.expandedGroup = group;
    document.querySelector('.assign-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  removeSongFromGroup(song: Song): void {
    if (this.saving) return;
    this.saving = true;
    this.songsApi.update(song.id, { ...song, linkGroup: null }).subscribe({
      next: async () => {
        this.saving = false;
        this.load();
        (await this.toast.create({ message: 'Brano rimosso dal medley.', duration: 1800, color: 'success' })).present();
      },
      error: (error: Error) => { this.saving = false; this.error = error.message || 'Rimozione non riuscita.'; },
    });
  }

  async renameGroup(group: string): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Modifica medley',
      inputs: [{ name: 'name', type: 'text', value: group, placeholder: 'Nome del medley' }],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Salva', handler: (value: { name?: string }) => { const name = value.name?.trim(); if (name && name !== group) this.updateGroup(group, name); } },
      ],
    });
    await dialog.present();
  }

  async removeGroup(group: string): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Rimuovere il medley?',
      message: 'I brani resteranno nel repertorio, ma verranno scollegati da questo medley.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Rimuovi', role: 'destructive', handler: () => this.updateGroup(group, null) },
      ],
    });
    await dialog.present();
  }

  private updateGroup(group: string, newName: string | null): void {
    if (this.saving) return;
    const groupSongs = this.songs().filter((song) => song.linkGroup === group);
    this.saving = true;
    forkJoin(groupSongs.map((song) => this.songsApi.update(song.id, { ...song, linkGroup: newName }))).subscribe({
      next: async () => {
        this.saving = false;
        this.load();
        (await this.toast.create({ message: newName ? 'Medley rinominato.' : 'Medley rimosso.', duration: 1800, color: 'success' })).present();
      },
      error: (error: Error) => { this.saving = false; this.error = error.message || 'Operazione non riuscita.'; },
    });
  }

  moveSong(group: string, index: number, direction: -1 | 1): void {
    const items = this.orderedSongs(group);
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    this.saveOrder(group, items.map((song) => song.id));
    this.songs.set([...this.songs().filter((song) => song.linkGroup !== group), ...items]);
  }

  reorder(event: CustomEvent<{ from: number; to: number; complete: (list?: Song[]) => void }>, group: string): void {
    const items = this.orderedSongs(group);
    const { from, to } = event.detail;
    if (from !== to) {
      const [song] = items.splice(from, 1);
      items.splice(to, 0, song);
      this.saveOrder(group, items.map((item) => item.id));
      this.songs.set([...this.songs().filter((item) => item.linkGroup !== group), ...items]);
    }
    event.detail.complete();
  }

  private savedOrder(group: string): number[] {
    try { return JSON.parse(localStorage.getItem(this.orderKey(group)) ?? '[]') as number[]; } catch { return []; }
  }

  private saveOrder(group: string, ids: number[]): void {
    localStorage.setItem(this.orderKey(group), JSON.stringify(ids));
  }

  private orderKey(group: string): string {
    const bandId = this.route.snapshot.paramMap.get('bandId') ?? this.route.parent?.snapshot.paramMap.get('bandId') ?? 'current';
    return `gigsaw:medley-order:${bandId}:${group}`;
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

    const selectedSongs = this.songs().filter((song) => this.selectedIds.includes(song.id));
    forkJoin(
      selectedSongs.map((song) => this.songsApi.update(song.id, { ...song, linkGroup })),
    ).subscribe({
      next: async () => {
        this.saving = false;
        this.selectedIds = [];
        this.editingGroup.set(null);
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
