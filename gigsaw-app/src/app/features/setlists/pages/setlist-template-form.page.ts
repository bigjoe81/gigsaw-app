
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { forkJoin, of } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { SongService } from '../../songs/services/song.service';
import { SetlistTemplate } from '../models/setlist.models';
import { SetlistService } from '../services/setlist.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonSpinner, IonTextarea, IonTitle, IonToggle, IonToolbar],
  templateUrl: './setlist-template-form.page.html',
  styles: ['.generation-sections{display:grid;gap:18px}.gen-section{display:grid;gap:10px;padding:2px 0}.gen-section h3{margin:0;font-size:1rem;font-weight:700}.gen-intro{margin:0;color:var(--ion-color-medium-shade);font-size:.92rem;line-height:1.4}.field-help{display:block;margin:-2px 16px 0;color:var(--ion-color-medium);font-size:.82rem;line-height:1.35}.field-error{display:block;margin:-2px 16px 0;color:var(--ion-color-danger);font-size:.82rem;line-height:1.35}.invalid-field{--highlight-color-focused:var(--ion-color-danger);}.tag-suggestions{display:flex;gap:8px;flex-wrap:wrap;padding:4px 16px 0;}'],
})
export class SetlistTemplateFormPage implements OnInit {
  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    description: this.fb.nonNullable.control(''),
    targetSongCount: this.fb.control<number | null>(null),
    songTagsText: this.fb.nonNullable.control(''),
    totalShowDurationText: this.fb.nonNullable.control(''),
    setCount: this.fb.control<number | null>(null),
    setTargetsText: this.fb.nonNullable.control(''),
    breakDurationText: this.fb.nonNullable.control(''),
    minDifferenceRatio: this.fb.control<number | null>(null),
    slowSongBpmThreshold: this.fb.control<number | null>(null),
    avoidAdjacentSameKey: this.fb.nonNullable.control(true),
    avoidAdjacentSlowSongs: this.fb.nonNullable.control(true),
    maxConsecutiveSlowSongs: this.fb.control<number | null>(null),
  });

  songs: Song[] = [];
  openingSongIds: number[] = [];
  closingSongIds: number[] = [];
  encoreSongIds: number[] = [];
  editing = false;
  saving = false;
  error = '';
  private id?: number;

  get availableSongTags(): string[] {
    return Array.from(new Set(
      this.songs
        .reduce<string[]>((tags, song) => tags.concat(song.tags ?? []), [])
        .map((tag) => tag.trim())
        .filter((tag) => !!tag),
    )).sort();
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly setlistsApi: SetlistService,
    private readonly songsApi: SongService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('templateId')) || undefined;
    this.editing = !!this.id;

    forkJoin({
      songs: this.songsApi.list(),
      template: this.id ? this.setlistsApi.getTemplate(this.id) : of(undefined),
    }).subscribe({
      next: ({ songs, template }) => {
        this.songs = songs;
        if (template) this.patchTemplate(template);
      },
      error: () => {
        this.error = 'Impossibile caricare il template.';
      },
    });
  }

  patchTemplate(template: SetlistTemplate): void {
    this.openingSongIds = [...(template.openingSongIds ?? [])];
    this.closingSongIds = [...(template.closingSongIds ?? [])];
    this.encoreSongIds = [...(template.encoreSongIds ?? [])];
    this.form.patchValue({
      name: template.name,
      description: template.description ?? '',
      targetSongCount: template.targetSongCount ?? null,
      songTagsText: (template.songTags ?? []).join(', '),
      totalShowDurationText: this.secondsToHourMinute(template.totalShowDurationSeconds),
      setCount: template.setCount ?? null,
      setTargetsText: this.secondsListToHourMinuteCsv(template.setTargets),
      breakDurationText: this.secondsToMinuteSecond(template.breakDurationSeconds),
      minDifferenceRatio: template.minDifferenceRatio ?? null,
      slowSongBpmThreshold: template.slowSongBpmThreshold ?? null,
      avoidAdjacentSameKey: template.avoidAdjacentSameKey ?? true,
      avoidAdjacentSlowSongs: template.avoidAdjacentSlowSongs ?? true,
      maxConsecutiveSlowSongs: template.maxConsecutiveSlowSongs ?? null,
    });
  }

  save(): void {
    if (this.form.invalid || this.hasGenerationTimeValidationErrors() || this.saving) {
      this.form.markAllAsTouched();
      if (this.hasGenerationTimeValidationErrors()) {
        this.error = 'Controlla i formati durata prima di salvare il template.';
      }
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: Partial<SetlistTemplate> = {
      name: this.form.controls.name.value,
      description: this.form.controls.description.value || null,
      targetSongCount: this.form.controls.targetSongCount.value,
      songTags: this.parseTagList(this.form.controls.songTagsText.value),
      totalShowDurationSeconds: this.parseHourMinuteToSeconds(this.form.controls.totalShowDurationText.value),
      setCount: this.form.controls.setCount.value,
      setTargets: this.parseCsvHourMinute(this.form.controls.setTargetsText.value),
      breakDurationSeconds: this.parseMinuteSecondToSeconds(this.form.controls.breakDurationText.value),
      minDifferenceRatio: this.form.controls.minDifferenceRatio.value,
      slowSongBpmThreshold: this.form.controls.slowSongBpmThreshold.value,
      openingSongIds: this.openingSongIds,
      closingSongIds: this.closingSongIds,
      encoreSongIds: this.encoreSongIds,
      avoidAdjacentSameKey: this.form.controls.avoidAdjacentSameKey.value,
      avoidAdjacentSlowSongs: this.form.controls.avoidAdjacentSlowSongs.value,
      maxConsecutiveSlowSongs: this.form.controls.maxConsecutiveSlowSongs.value,
    };

    const request = this.editing
      ? this.setlistsApi.updateTemplate(this.id!, payload)
      : this.setlistsApi.createTemplate(payload);

    request.subscribe({
      next: async (template) => {
        (await this.toast.create({ message: 'Template salvato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate([template.id], { relativeTo: this.route.parent });
      },
      error: (error: Error) => {
        this.error = error.message || 'Salvataggio non riuscito.';
        this.saving = false;
      },
    });
  }

  parseCsvHourMinute(value: string): number[] {
    return value.split(',').map((item) => this.parseHourMinuteToSeconds(item.trim())).filter((item): item is number => item !== null && Number.isFinite(item) && item > 0);
  }

  parseTagList(value: string): string[] {
    return Array.from(new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ));
  }

  showTotalShowDurationError(): boolean {
    return this.shouldShowTimingError(this.form.controls.totalShowDurationText.value)
      && !this.isHourMinuteValueValid(this.form.controls.totalShowDurationText.value);
  }

  showSetTargetsError(): boolean {
    return this.shouldShowTimingError(this.form.controls.setTargetsText.value)
      && !this.isHourMinuteCsvValid(this.form.controls.setTargetsText.value);
  }

  showBreakDurationError(): boolean {
    return this.shouldShowTimingError(this.form.controls.breakDurationText.value)
      && !this.isMinuteSecondValueValid(this.form.controls.breakDurationText.value);
  }

  normalizeTotalShowDuration(): void {
    this.normalizeControlValue('totalShowDurationText', (value) => this.normalizeHourMinuteValue(value));
  }

  normalizeSetTargets(): void {
    this.normalizeControlValue('setTargetsText', (value) => this.normalizeHourMinuteCsvValue(value));
  }

  normalizeBreakDuration(): void {
    this.normalizeControlValue('breakDurationText', (value) => this.normalizeMinuteSecondValue(value));
  }

  segmentSelected(segment: 'opening' | 'closing' | 'encore', song: Song): boolean {
    const selectedIds = this.segmentIds(segment);
    return this.songBlock(song).every((item) => selectedIds.includes(item.id));
  }

  toggleSegmentSong(segment: 'opening' | 'closing' | 'encore', song: Song): void {
    const selectedIds = this.segmentIds(segment);
    const blockIds = this.songBlock(song).map((item) => item.id);
    const allSelected = blockIds.every((id) => selectedIds.includes(id));

    const next = allSelected
      ? selectedIds.filter((id) => !blockIds.includes(id))
      : [...selectedIds, ...blockIds.filter((id) => !selectedIds.includes(id))];

    if (!allSelected) {
      this.removeIdsFromOtherSegments(segment, blockIds);
    }

    this.setSegmentIds(segment, next);
  }

  songBlock(song: Song): Song[] {
    if (!song.linkGroup) return [song];
    return this.songs.filter((item) => item.linkGroup === song.linkGroup);
  }

  songMeta(song: Song): string {
    return [
      song.key,
      song.bpm ? `${song.bpm} bpm` : '',
      song.duration ? this.formatSeconds(song.duration) : '',
      song.linkGroup ? `Link: ${song.linkGroup}` : '',
      song.tags?.length ? `Tag: ${song.tags.join(', ')}` : '',
    ].filter(Boolean).join(' · ');
  }

  applySongTag(tag: string): void {
    const next = new Set(this.parseTagList(this.form.controls.songTagsText.value));
    next.add(tag);
    this.form.patchValue({ songTagsText: Array.from(next).join(', ') });
  }

  hasSongTag(tag: string): boolean {
    return this.parseTagList(this.form.controls.songTagsText.value).includes(tag);
  }

  get openingDuration(): number {
    return this.segmentDuration(this.openingSongIds);
  }

  get openingCount(): number {
    return this.segmentUniqueCount(this.openingSongIds);
  }

  get closingDuration(): number {
    return this.segmentDuration(this.closingSongIds);
  }

  get closingCount(): number {
    return this.segmentUniqueCount(this.closingSongIds);
  }

  get encoreDuration(): number {
    return this.segmentDuration(this.encoreSongIds);
  }

  get encoreCount(): number {
    return this.segmentUniqueCount(this.encoreSongIds);
  }

  get totalPinnedDuration(): number {
    return this.segmentDuration([
      ...this.openingSongIds,
      ...this.closingSongIds,
      ...this.encoreSongIds,
    ]);
  }

  get totalPinnedCount(): number {
    return this.segmentUniqueCount([
      ...this.openingSongIds,
      ...this.closingSongIds,
      ...this.encoreSongIds,
    ]);
  }

  formatSeconds(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  parseHourMinuteToSeconds(value: string): number | null {
    const normalized = value.trim();
    if (!normalized) return null;

    const match = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
      return null;
    }

    return (hours * 60 * 60) + (minutes * 60);
  }

  secondsToHourMinute(value?: number | null): string {
    if (value === null || value === undefined || value <= 0) return '';

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);

    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }

  parseMinuteSecondToSeconds(value: string): number | null {
    const normalized = value.trim();
    if (!normalized) return null;

    const match = normalized.match(/^(\d{1,3}):(\d{1,2})$/);
    if (!match) return null;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);

    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds > 59) {
      return null;
    }

    return (minutes * 60) + seconds;
  }

  secondsToMinuteSecond(value?: number | null): string {
    if (value === null || value === undefined || value < 0) return '';

    const minutes = Math.floor(value / 60);
    const seconds = value % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  secondsListToHourMinuteCsv(values?: number[] | null): string {
    return (values ?? []).map((value) => this.secondsToHourMinute(value)).filter(Boolean).join(', ');
  }

  private hasGenerationTimeValidationErrors(): boolean {
    return !this.isHourMinuteValueValid(this.form.controls.totalShowDurationText.value)
      || !this.isHourMinuteCsvValid(this.form.controls.setTargetsText.value)
      || !this.isMinuteSecondValueValid(this.form.controls.breakDurationText.value);
  }

  private isHourMinuteValueValid(value: string): boolean {
    const normalized = value.trim();
    return !normalized || this.parseHourMinuteToSeconds(normalized) !== null;
  }

  private isHourMinuteCsvValid(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) return true;

    const items = normalized.split(',').map((item) => item.trim());
    return items.every((item) => !!item && (this.parseHourMinuteToSeconds(item) ?? 0) > 0);
  }

  private isMinuteSecondValueValid(value: string): boolean {
    const normalized = value.trim();
    return !normalized || this.parseMinuteSecondToSeconds(normalized) !== null;
  }

  private shouldShowTimingError(value: string): boolean {
    return !!value.trim();
  }

  private normalizeHourMinuteValue(value: string): string {
    const seconds = this.parseHourMinuteToSeconds(value);
    return seconds === null ? value.trim() : this.secondsToHourMinute(seconds);
  }

  private normalizeHourMinuteCsvValue(value: string): string {
    const normalized = value.trim();
    if (!normalized) return '';

    const items = normalized.split(',').map((item) => item.trim());
    if (!items.every((item) => !!item && (this.parseHourMinuteToSeconds(item) ?? 0) > 0)) {
      return normalized;
    }

    return items
      .map((item) => this.secondsToHourMinute(this.parseHourMinuteToSeconds(item)))
      .filter(Boolean)
      .join(', ');
  }

  private normalizeMinuteSecondValue(value: string): string {
    const seconds = this.parseMinuteSecondToSeconds(value);
    return seconds === null ? value.trim() : this.secondsToMinuteSecond(seconds);
  }

  private normalizeControlValue(
    controlName: 'totalShowDurationText' | 'setTargetsText' | 'breakDurationText',
    normalizer: (value: string) => string,
  ): void {
    const control = this.form.controls[controlName];
    const normalized = normalizer(control.value);
    if (normalized !== control.value) {
      control.setValue(normalized);
    }
  }

  private segmentDuration(songIds: number[]): number {
    const uniqueIds = new Set(songIds);
    return this.songs
      .filter((song) => uniqueIds.has(song.id))
      .reduce((total, song) => total + (song.duration ?? 0), 0);
  }

  private segmentUniqueCount(songIds: number[]): number {
    return new Set(songIds).size;
  }

  private segmentIds(segment: 'opening' | 'closing' | 'encore'): number[] {
    if (segment === 'opening') return this.openingSongIds;
    if (segment === 'closing') return this.closingSongIds;
    return this.encoreSongIds;
  }

  private setSegmentIds(segment: 'opening' | 'closing' | 'encore', songIds: number[]): void {
    if (segment === 'opening') this.openingSongIds = songIds;
    else if (segment === 'closing') this.closingSongIds = songIds;
    else this.encoreSongIds = songIds;
  }

  private removeIdsFromOtherSegments(segment: 'opening' | 'closing' | 'encore', songIds: number[]): void {
    if (segment !== 'opening') {
      this.openingSongIds = this.openingSongIds.filter((id) => !songIds.includes(id));
    }

    if (segment !== 'closing') {
      this.closingSongIds = this.closingSongIds.filter((id) => !songIds.includes(id));
    }

    if (segment !== 'encore') {
      this.encoreSongIds = this.encoreSongIds.filter((id) => !songIds.includes(id));
    }
  }
}
