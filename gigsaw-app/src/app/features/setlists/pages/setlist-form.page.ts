
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
  IonCol,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import type { ItemReorderEventDetail } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { Gig, Setlist, SetlistMemberNote, Song } from '../../../core/models/band-resources.models';
import { BandMember } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { GigService } from '../../gigs/services/gig.service';
import { SongService } from '../../songs/services/song.service';
import {
  SetlistGeneratePayload,
  SetlistSongEntryPayload,
  SetlistTemplate,
  SetlistUpsertPayload,
} from '../models/setlist.models';
import { SetlistService } from '../services/setlist.service';

type MagicSetPreset = 'short' | 'standard' | 'wedding' | 'pub3';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonCol,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonGrid,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonNote,
    IonReorder,
    IonReorderGroup,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar
],
  templateUrl: './setlist-form.page.html',
  styleUrls: ['./setlist-form.page.scss'],
})
export class SetlistFormPage implements OnInit {
  form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required]),
    date: this.fb.nonNullable.control(''),
    gigId: this.fb.control<number | null>(null),
    notes: this.fb.nonNullable.control(''),
    templateId: this.fb.control<number | null>(null),
    targetSongCount: this.fb.control<number | null>(null),
    totalShowDurationText: this.fb.nonNullable.control(''),
    setCount: this.fb.control<number | null>(null),
    setTargetsText: this.fb.nonNullable.control(''),
    breakDurationText: this.fb.nonNullable.control(''),
    songTagsText: this.fb.nonNullable.control(''),
    minDifferenceRatio: this.fb.control<number | null>(null),
    slowSongBpmThreshold: this.fb.control<number | null>(null),
    avoidAdjacentSameKey: this.fb.nonNullable.control(true),
    avoidAdjacentSlowSongs: this.fb.nonNullable.control(true),
    maxConsecutiveSlowSongs: this.fb.control<number | null>(null),
  });

  songs: Song[] = [];
  gigs: Gig[] = [];
  templates: SetlistTemplate[] = [];
  preview?: Setlist;
  showGenerationModal = false;
  showAdvancedMagicSet = false;
  editing = false;
  saving = false;
  generating = false;
  error = '';
  bandMembers: BandMember[] = [];
  songSearch = '';
  showOnlyAvailableSongs = false;
  dragCatalogSongId: number | null = null;
  dragSelectedSongId: number | null = null;
  catalogDropActive = false;
  selectedDropActive = false;
  private id?: number;
  private bandId?: number;
  private selectedSongEntries: SetlistSongEntryPayload[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly setlistsApi: SetlistService,
    private readonly bandApi: BandService,
    private readonly songsApi: SongService,
    private readonly gigsApi: GigService,
    readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {}

  get selectedSongs(): Song[] {
    return this.selectedSongEntries
      .map((entry) => this.songs.find((song) => song.id === entry.songId))
      .filter((song): song is Song => !!song);
  }

  get filteredSongs(): Song[] {
    const query = this.songSearch.trim().toLowerCase();

    return this.songs.filter((song) => {
      if (this.showOnlyAvailableSongs && this.isSelected(song)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        song.title,
        song.performedBy,
        song.album,
        song.key,
        song.bpm ? String(song.bpm) : '',
        song.linkGroup,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get catalogSongs(): Song[] {
    return this.filteredSongs;
  }

  get selectedCatalogSongs(): Song[] {
    return this.filteredSongs.filter((song) => this.isSelected(song));
  }

  get selectedDurationSeconds(): number {
    return this.selectedSongs.reduce((total, song) => total + (song.duration ?? 0), 0);
  }

  get memberNotesCount(): number {
    return this.selectedSongEntries.reduce(
      (total, entry) => total + (entry.memberNotes?.filter((note) => !!note.notes.trim()).length ?? 0),
      0,
    );
  }

  get setlistNotesCount(): number {
    return this.selectedSongEntries.filter((entry) => !!entry.notes?.trim()).length;
  }

  get selectedGigLabel(): string | null {
    const gigId = this.form.controls.gigId.value;
    const gig = this.gigs.find((item) => item.id === gigId);
    return gig ? this.gigLabel(gig) : null;
  }

  get magicSetSummary(): Array<{ label: string; value: string }> {
    return [
      { label: 'Template', value: this.selectedTemplateName ?? 'Nessuno' },
      { label: 'Brani target', value: this.form.controls.targetSongCount.value ? String(this.form.controls.targetSongCount.value) : 'Automatico' },
      { label: 'Durata show', value: this.form.controls.totalShowDurationText.value.trim() || 'Non impostata' },
      { label: 'Set', value: this.form.controls.setCount.value ? String(this.form.controls.setCount.value) : '1' },
      { label: 'Target set', value: this.form.controls.setTargetsText.value.trim() || 'Distribuzione automatica' },
      { label: 'Pausa', value: this.form.controls.breakDurationText.value.trim() || 'Nessuna' },
      { label: 'Tag brani', value: this.form.controls.songTagsText.value.trim() || 'Tutti' },
    ];
  }

  get availableSongTags(): string[] {
    return Array.from(new Set(
      this.songs
        .reduce<string[]>((tags, song) => tags.concat(song.tags ?? []), [])
        .map((tag) => tag.trim())
        .filter((tag) => !!tag),
    )).sort();
  }

  get selectedTemplateName(): string | null {
    const templateId = this.form.controls.templateId.value;
    const template = this.templates.find((item) => item.id === templateId);
    return template?.name ?? null;
  }

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;

    forkJoin({
      band: this.bandId ? this.bandApi.get(this.bandId) : of(undefined),
      songs: this.songsApi.list(),
      gigs: this.gigsApi.list(),
      templates: this.setlistsApi.listTemplates(),
      setlist: this.id ? this.setlistsApi.get(this.id) : of(undefined),
    }).subscribe({
      next: ({ band, songs, gigs, templates, setlist }) => {
        this.bandMembers = band?.members ?? [];
        this.songs = songs;
        this.gigs = gigs;
        this.templates = templates;
        if (setlist) {
          this.patchSetlist(setlist);
        }
      },
      error: () => {
        this.error = 'Impossibile caricare i dati della setlist.';
      },
    });
  }

  patchSetlist(setlist: Setlist): void {
    this.selectedSongEntries = this.mapSetlistEntries(setlist);
    this.form.patchValue({
      title: setlist.title,
      date: setlist.date ?? '',
      gigId: setlist.gigId ?? null,
      notes: setlist.notes ?? '',
      totalShowDurationText: this.secondsToHourMinute(setlist.generation?.totalShowDurationSeconds),
      setCount: setlist.generation?.setCount ?? null,
      setTargetsText: this.secondsListToHourMinuteCsv(setlist.generation?.setTargets),
      breakDurationText: this.secondsToMinuteSecond(setlist.generation?.breakDurationSeconds),
      songTagsText: (setlist.generation?.songTags ?? []).join(', '),
      minDifferenceRatio: setlist.generation?.minDifferenceRatio ?? null,
      slowSongBpmThreshold: setlist.generation?.slowSongBpmThreshold ?? null,
      avoidAdjacentSameKey: setlist.generation?.avoidAdjacentSameKey ?? true,
      avoidAdjacentSlowSongs: setlist.generation?.avoidAdjacentSlowSongs ?? true,
      maxConsecutiveSlowSongs: setlist.generation?.maxConsecutiveSlowSongs ?? null,
    });
  }

  onTemplateChange(): void {
    const templateId = this.form.controls.templateId.value;
    const template = this.templates.find((item) => item.id === templateId);
    if (!template) return;

    this.form.patchValue({
      targetSongCount: template.targetSongCount ?? null,
      totalShowDurationText: this.secondsToHourMinute(template.totalShowDurationSeconds),
      setCount: template.setCount ?? null,
      setTargetsText: this.secondsListToHourMinuteCsv(template.setTargets),
      breakDurationText: this.secondsToMinuteSecond(template.breakDurationSeconds),
      songTagsText: (template.songTags ?? []).join(', '),
      minDifferenceRatio: template.minDifferenceRatio ?? null,
      slowSongBpmThreshold: template.slowSongBpmThreshold ?? null,
      avoidAdjacentSameKey: template.avoidAdjacentSameKey ?? true,
      avoidAdjacentSlowSongs: template.avoidAdjacentSlowSongs ?? true,
      maxConsecutiveSlowSongs: template.maxConsecutiveSlowSongs ?? null,
    });
  }

  openGenerationModal(): void {
    this.showGenerationModal = true;
    this.showAdvancedMagicSet = false;
    this.error = '';
  }

  closeGenerationModal(): void {
    this.showGenerationModal = false;
  }

  applyMagicSetPreset(preset: MagicSetPreset): void {
    if (preset === 'short') {
      this.form.patchValue({
        targetSongCount: 10,
        totalShowDurationText: '1:15',
        setCount: 1,
        setTargetsText: '',
        breakDurationText: '',
        songTagsText: '',
        minDifferenceRatio: 0.25,
        slowSongBpmThreshold: 95,
        avoidAdjacentSameKey: true,
        avoidAdjacentSlowSongs: true,
        maxConsecutiveSlowSongs: 1,
      });
      return;
    }

    if (preset === 'standard') {
      this.form.patchValue({
        targetSongCount: 16,
        totalShowDurationText: '2:00',
        setCount: 2,
        setTargetsText: '1:00, 1:00',
        breakDurationText: '15:00',
        songTagsText: '',
        minDifferenceRatio: 0.3,
        slowSongBpmThreshold: 95,
        avoidAdjacentSameKey: true,
        avoidAdjacentSlowSongs: true,
        maxConsecutiveSlowSongs: 1,
      });
      return;
    }

    if (preset === 'wedding') {
      this.form.patchValue({
        targetSongCount: 24,
        totalShowDurationText: '3:30',
        setCount: 3,
        setTargetsText: '1:05, 1:05, 1:00',
        breakDurationText: '20:00',
        songTagsText: '',
        minDifferenceRatio: 0.4,
        slowSongBpmThreshold: 100,
        avoidAdjacentSameKey: true,
        avoidAdjacentSlowSongs: true,
        maxConsecutiveSlowSongs: 1,
      });
      return;
    }

    this.form.patchValue({
      targetSongCount: 18,
      totalShowDurationText: '2:45',
      setCount: 3,
      setTargetsText: '0:50, 0:50, 0:50',
      breakDurationText: '15:00',
      songTagsText: '',
      minDifferenceRatio: 0.35,
      slowSongBpmThreshold: 95,
      avoidAdjacentSameKey: true,
      avoidAdjacentSlowSongs: true,
      maxConsecutiveSlowSongs: 1,
    });
  }

  save(): void {
    if (this.form.invalid || this.hasGenerationTimeValidationErrors() || this.saving || this.generating) {
      this.form.markAllAsTouched();
      if (this.hasGenerationTimeValidationErrors()) {
        this.error = 'Controlla i formati durata prima di salvare.';
      }
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: SetlistUpsertPayload = {
      title: this.form.controls.title.value,
      date: this.normalizeDate(this.form.controls.date.value) || null,
      gigId: this.form.controls.gigId.value,
      notes: this.form.controls.notes.value || null,
      songEntries: this.serializedSongEntries(),
    };

    const request = this.editing
      ? this.setlistsApi.update(this.id!, payload)
      : this.setlistsApi.create(payload);

    request.subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Setlist salvata.', duration: 1800, color: 'success' })).present();
        void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/scalette` : '/bands');
      },
      error: (error: Error) => {
        this.error = error.message || 'Salvataggio non riuscito.';
        this.saving = false;
      },
    });
  }

  generate(save: boolean, applyToForm = false): void {
    if (this.generating) return;
    if (this.hasGenerationTimeValidationErrors()) {
      this.form.markAllAsTouched();
      this.error = 'Controlla i formati durata prima di generare la scaletta.';
      return;
    }

    this.generating = true;
    this.error = '';

    const payload: SetlistGeneratePayload = {
      templateId: this.form.controls.templateId.value,
      gigId: this.form.controls.gigId.value,
      referenceDate: this.normalizeDate(this.form.controls.date.value) || null,
      title: this.form.controls.title.value || null,
      notes: this.form.controls.notes.value || null,
      targetSongCount: this.form.controls.targetSongCount.value,
      totalShowDurationSeconds: this.parseHourMinuteToSeconds(this.form.controls.totalShowDurationText.value),
      setCount: this.form.controls.setCount.value,
      setTargets: this.parseSetTargets(),
      breakDurationSeconds: this.parseMinuteSecondToSeconds(this.form.controls.breakDurationText.value),
      songTags: this.parseTagList(this.form.controls.songTagsText.value),
      minDifferenceRatio: this.form.controls.minDifferenceRatio.value,
      slowSongBpmThreshold: this.form.controls.slowSongBpmThreshold.value,
      avoidAdjacentSameKey: this.form.controls.avoidAdjacentSameKey.value,
      avoidAdjacentSlowSongs: this.form.controls.avoidAdjacentSlowSongs.value,
      maxConsecutiveSlowSongs: this.form.controls.maxConsecutiveSlowSongs.value,
      save,
    };

    this.setlistsApi.generate(payload).subscribe({
      next: async (setlist) => {
        this.generating = false;
        if (save) {
          (await this.toast.create({ message: 'Setlist generata e salvata.', duration: 1800, color: 'success' })).present();
          this.closeGenerationModal();
          void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/scalette` : '/bands');
          return;
        }

        this.preview = setlist;
        if (applyToForm) {
          this.applyPreview(false);
          this.closeGenerationModal();
          (await this.toast.create({ message: 'Magic Set applicata alla form.', duration: 1800, color: 'success' })).present();
        }
      },
      error: (error: Error) => {
        this.generating = false;
        this.error = error.message || 'Generazione non riuscita.';
      },
    });
  }

  onDateChange(event: CustomEvent<{ value?: string | string[] | null }>): void {
    this.form.patchValue({ date: this.normalizeDate(event.detail.value) }, { emitEvent: false });
  }

  private normalizeDate(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) {
      return this.normalizeDate(value[0]);
    }

    return value ? String(value).slice(0, 10) : '';
  }

  applyPreview(showToast = true): void {
    if (!this.preview) return;

    this.selectedSongEntries = this.mapSetlistEntries(this.preview);
    if (showToast) {
      void this.toast
        .create({ message: 'Anteprima applicata.', duration: 1600, color: 'success' })
        .then((toast) => toast.present());
    }
  }

  isSelected(song: Song): boolean {
    if (!song.linkGroup) {
      return this.selectedSongEntries.some((entry) => entry.songId === song.id);
    }

    return this.songs
      .filter((item) => item.linkGroup === song.linkGroup)
      .every((item) => this.selectedSongEntries.some((entry) => entry.songId === item.id));
  }

  toggleSong(song: Song): void {
    const block = this.songBlock(song);
    const selected = block.every((item) => this.selectedSongEntries.some((entry) => entry.songId === item.id));

    if (selected) {
      this.selectedSongEntries = this.selectedSongEntries.filter((entry) => !block.some((item) => item.id === entry.songId));
      return;
    }

    const next = [...this.selectedSongEntries];
    for (const item of block) {
      if (!next.some((entry) => entry.songId === item.id)) {
        next.push({ songId: item.id, notes: '', memberNotes: [] });
      }
    }
    this.selectedSongEntries = next;
  }

  onCatalogDragStart(song: Song): void {
    if (this.isSelected(song)) {
      this.dragCatalogSongId = null;
      return;
    }

    this.dragCatalogSongId = song.id;
  }

  onCatalogDragEnd(): void {
    this.dragCatalogSongId = null;
    this.selectedDropActive = false;
  }

  onSelectedDragStart(song: Song): void {
    this.dragSelectedSongId = song.id;
  }

  onSelectedDragEnd(): void {
    this.dragSelectedSongId = null;
    this.catalogDropActive = false;
  }

  onSelectedDropZoneEnter(event: DragEvent): void {
    if (!this.dragCatalogSongId) {
      return;
    }

    event.preventDefault();
    this.selectedDropActive = true;
  }

  onSelectedDropZoneOver(event: DragEvent): void {
    if (!this.dragCatalogSongId) {
      return;
    }

    event.preventDefault();
  }

  onSelectedDropZoneLeave(): void {
    this.selectedDropActive = false;
  }

  onSelectedDropZoneDrop(event: DragEvent): void {
    if (!this.dragCatalogSongId) {
      return;
    }

    event.preventDefault();

    const song = this.songs.find((item) => item.id === this.dragCatalogSongId);
    this.selectedDropActive = false;
    this.dragCatalogSongId = null;

    if (song && !this.isSelected(song)) {
      this.toggleSong(song);
    }
  }

  onCatalogDropZoneEnter(event: DragEvent): void {
    if (!this.dragSelectedSongId) {
      return;
    }

    event.preventDefault();
    this.catalogDropActive = true;
  }

  onCatalogDropZoneOver(event: DragEvent): void {
    if (!this.dragSelectedSongId) {
      return;
    }

    event.preventDefault();
  }

  onCatalogDropZoneLeave(): void {
    this.catalogDropActive = false;
  }

  onCatalogDropZoneDrop(event: DragEvent): void {
    if (!this.dragSelectedSongId) {
      return;
    }

    event.preventDefault();

    const song = this.songs.find((item) => item.id === this.dragSelectedSongId);
    this.catalogDropActive = false;
    this.dragSelectedSongId = null;

    if (song && this.isSelected(song)) {
      this.removeSong(song);
    }
  }

  removeSong(song: Song): void {
    const block = this.songBlock(song);
    this.selectedSongEntries = this.selectedSongEntries.filter((entry) => !block.some((item) => item.id === entry.songId));
  }

  handleReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    const from = event.detail.from;
    const to = event.detail.to;

    const song = this.selectedSongs[from];
    if (!song) {
      event.detail.complete();
      return;
    }

    const selectedSongIds = this.selectedSongEntries.map((entry) => entry.songId);
    const blockIds = this.songBlock(song).map((item) => item.id);
    const positions = blockIds
      .map((songId) => selectedSongIds.indexOf(songId))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b);

    if (!positions.length) {
      event.detail.complete();
      return;
    }

    const reordered = [...this.selectedSongEntries];
    const start = positions[0];
    const length = positions.length;
    const slice = reordered.splice(start, length);

    let insertAt = to;
    if (to > start) {
      insertAt = Math.max(to - length + 1, 0);
    }

    reordered.splice(insertAt, 0, ...slice);
    this.selectedSongEntries = reordered;
    event.detail.complete();
  }

  songEntryNotes(songId: number): string {
    return this.selectedSongEntries.find((entry) => entry.songId === songId)?.notes ?? '';
  }

  memberNoteValue(songId: number, userId: number): string {
    return this.selectedSongEntries
      .find((entry) => entry.songId === songId)
      ?.memberNotes
      ?.find((note) => note.userId === userId)
      ?.notes ?? '';
  }

  updateSongNotes(songId: number, value: string): void {
    this.selectedSongEntries = this.selectedSongEntries.map((entry) =>
      entry.songId === songId ? { ...entry, notes: value } : entry,
    );
  }

  updateMemberNote(songId: number, userId: number, value: string): void {
    this.selectedSongEntries = this.selectedSongEntries.map((entry) => {
      if (entry.songId !== songId) {
        return entry;
      }

      const nextMemberNotes = [...(entry.memberNotes ?? [])];
      const index = nextMemberNotes.findIndex((note) => note.userId === userId);

      if (!value.trim()) {
        if (index >= 0) {
          nextMemberNotes.splice(index, 1);
        }
      } else if (index >= 0) {
        nextMemberNotes[index] = { userId, notes: value };
      } else {
        nextMemberNotes.push({ userId, notes: value });
      }

      return { ...entry, memberNotes: nextMemberNotes };
    });
  }

  eventValue(event: Event): string {
    return (event as CustomEvent<{ value?: string | null }>).detail?.value ?? '';
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
    ].filter(Boolean).join(' · ');
  }

  gigLabel(gig: Gig): string {
    return [gig.title, gig.date].filter(Boolean).join(' · ');
  }

  catalogSubtitle(song: Song): string {
    return [
      song.performedBy,
      song.album,
      song.tags?.length ? `Tag: ${song.tags.join(', ')}` : '',
    ].filter(Boolean).join(' · ');
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

    return (hours * 3600) + (minutes * 60);
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

  applySongTag(tag: string): void {
    const next = new Set(this.parseTagList(this.form.controls.songTagsText.value));
    next.add(tag);
    this.form.patchValue({ songTagsText: Array.from(next).join(', ') });
  }

  hasSongTag(tag: string): boolean {
    return this.parseTagList(this.form.controls.songTagsText.value).includes(tag);
  }

  parseSetTargets(): number[] {
    return this.form.controls.setTargetsText.value
      .split(',')
      .map((item) => this.parseHourMinuteToSeconds(item.trim()))
      .filter((item): item is number => item !== null && Number.isFinite(item) && item > 0);
  }

  goToTemplates(): void {
    void this.router.navigate(['../templates'], { relativeTo: this.route });
  }

  private mapSetlistEntries(setlist: Setlist): SetlistSongEntryPayload[] {
    const songs = setlist.songEntries?.length ? setlist.songEntries : setlist.songs;

    if (songs?.length) {
      return songs.map((song) => ({
        songId: song.id,
        notes: song.setlistNotes ?? '',
        memberNotes: [...(song.memberNotes ?? [])],
      }));
    }

    return (setlist.songIds ?? []).map((songId) => ({ songId, notes: '', memberNotes: [] }));
  }

  private serializedSongEntries(): SetlistSongEntryPayload[] {
    return this.selectedSongEntries.map((entry) => ({
      songId: entry.songId,
      notes: entry.notes?.trim() ? entry.notes.trim() : null,
      memberNotes: (entry.memberNotes ?? [])
        .map((note): SetlistMemberNote => ({
          userId: note.userId,
          notes: note.notes.trim(),
        }))
        .filter((note) => !!note.notes),
    }));
  }

  private parseTagList(value: string): string[] {
    return Array.from(new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ));
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

  private getBandId(): number | undefined {
    const segments = [
      this.route.snapshot,
      this.route.parent?.snapshot,
      this.route.parent?.parent?.snapshot,
      this.route.parent?.parent?.parent?.snapshot,
    ];

    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
  }
}
