
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonChip, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { forkJoin, of } from 'rxjs';
import { Song, SongStatus } from '../../../core/models/band-resources.models';
import { SongService } from '../services/song.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonChip, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './song-form.page.html',
  styles: ['.suggestions{display:flex;gap:8px;flex-wrap:wrap;padding:8px 16px 0}'],
})
export class SongFormPage implements OnInit {
  form = this.fb.nonNullable.group({ title: ['', Validators.required], album: '', performedBy: '', musicBy: '', lyricsBy: '', key: '', bpm: '', duration: ['', Validators.required], linkGroup: '', tagsText: '', status: 'draft' as SongStatus, notes: '' });
  existingLinkGroups: string[] = [];
  existingTags: string[] = [];
  editing = false;
  saving = false;
  error = '';
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly songs: SongService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    forkJoin({
      songs: this.songs.list(),
      song: this.id ? this.songs.get(this.id) : of(undefined),
    }).subscribe({
      next: ({ songs, song }) => {
        this.existingLinkGroups = Array.from(new Set(songs.map((item) => item.linkGroup).filter((group): group is string => !!group))).sort();
        this.existingTags = Array.from(new Set(
          songs
            .reduce<string[]>((tags, item) => tags.concat(item.tags ?? []), [])
            .map((tag) => tag.trim())
            .filter((tag) => !!tag),
        )).sort();
        if (song) {
          this.form.patchValue({ title: song.title, album: song.album ?? '', performedBy: song.performedBy ?? '', musicBy: song.musicBy ?? '', lyricsBy: song.lyricsBy ?? '', key: song.key ?? '', bpm: song.bpm != null ? String(song.bpm) : '', duration: this.formatDuration(song.duration), linkGroup: song.linkGroup ?? '', tagsText: (song.tags ?? []).join(', '), status: song.status ?? 'draft', notes: song.notes ?? '' });
        }
      },
      error: () => this.error = 'Impossibile caricare il brano.',
    });
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const durationSeconds = this.parseDuration(this.form.getRawValue().duration);
    const values = this.form.getRawValue();
    const payload: Partial<Song> = {
      title: values.title,
      album: values.album,
      performedBy: values.performedBy,
      musicBy: values.musicBy,
      lyricsBy: values.lyricsBy,
      key: values.key,
      status: values.status,
      notes: values.notes,
      bpm: this.toNumber(values.bpm),
      duration: durationSeconds,
      linkGroup: values.linkGroup.trim() || null,
      tags: this.parseTags(values.tagsText),
    };
    const request = this.editing ? this.songs.update(this.id!, payload) : this.songs.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Brano salvato.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/repertorio` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
  }

  private toNumber(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDuration(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(':').map((part) => Number(part));
    if (parts.length === 1) {
      return Number.isFinite(parts[0]) ? parts[0] : null;
    }

    if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
      return null;
    }

    const [minutes, seconds] = parts;
    if (seconds < 0 || seconds >= 60 || minutes < 0) {
      return null;
    }

    return (minutes * 60) + seconds;
  }

  private formatDuration(value?: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }

    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  applyLinkGroup(group: string): void {
    this.form.patchValue({ linkGroup: group });
  }

  applyTag(tag: string): void {
    const next = new Set(this.parseTags(this.form.controls.tagsText.value));
    next.add(tag);
    this.form.patchValue({ tagsText: Array.from(next).join(', ') });
  }

  hasTag(tag: string): boolean {
    return this.parseTags(this.form.controls.tagsText.value).includes(tag);
  }

  private parseTags(value: string): string[] {
    return Array.from(new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ));
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
  }
}
