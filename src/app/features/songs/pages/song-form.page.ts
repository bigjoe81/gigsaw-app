
import { Component, computed, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonChip, IonContent, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner, IonTextarea, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, musicalNotesOutline, searchOutline, sparklesOutline } from 'ionicons/icons';
import { finalize, forkJoin, of } from 'rxjs';
import { Song, SongStatus } from '../../../core/models/band-resources.models';
import { FormPageHeaderComponent, FormPageHeaderSection } from '../../../shared/ui/form-page-header.component';
import { SongService } from '../services/song.service';
import { SongMetadataCandidate, SongMetadataDetail } from '../models/song.models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormPageHeaderComponent, IonButton, IonChip, IonContent, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner, IonTextarea],
  templateUrl: './song-form.page.html',
  styleUrls: ['./song-form.page.scss'],
  styles: [`
    :host { width: 100%; }
    .song-content { --background: #fff; }
    .song-shell {
      width: 100%;
      max-width: none;
      min-height: 100%;
      margin: 0;
      box-shadow: none;
    }
    .field-grid ion-select::part(icon) {
      position: absolute;
      top: 50%;
      right: 16px;
      margin: 0;
      transform: translateY(-50%);
    }
  `],
})
export class SongFormPage implements OnInit, OnDestroy {
  readonly songSections: FormPageHeaderSection[] = [{ id: 1, label: 'Cerca' }, { id: 2, label: 'Dettagli' }, { id: 3, label: 'Organizza' }];
  form = this.fb.nonNullable.group({ title: ['', Validators.required], album: '', performedBy: '', musicBy: '', lyricsBy: '', key: ['', Validators.required], bpm: '', duration: ['', Validators.required], linkGroup: '', tagsText: '', status: 'draft' as SongStatus, notes: '' });
  magicForm = this.fb.nonNullable.group({ title: ['', [Validators.required, Validators.minLength(2)]], artist: '' });
  existingLinkGroups: string[] = [];
  existingTags: string[] = [];
  creatingLinkGroup = false;
  editing = false;
  readonly step = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly magicLoading = signal(false);
  readonly detailLoading = signal(false);
  readonly metadataResults = signal<SongMetadataCandidate[]>([]);
  readonly selectedMetadata = signal<SongMetadataDetail | null>(null);
  readonly spotifyEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const metadata = this.selectedMetadata();
    if (metadata?.provider !== 'spotify') return null;
    const source = `${metadata.externalId || ''} ${metadata.externalUrl || ''}`;
    const trackId = source.match(/(?:spotify:track:|open\.spotify\.com\/track\/)?([A-Za-z0-9]{22})(?:\b|\?)/)?.[1];
    if (!trackId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`);
  });
  readonly error = signal('');
  readonly magicError = signal('');
  readonly tapCount = signal(0);
  readonly tappedBpm = signal<number | null>(null);
  private tapTimestamps: number[] = [];
  private tapResetTimer?: ReturnType<typeof setTimeout>;
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly songs: SongService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController, private readonly sanitizer: DomSanitizer) {
    addIcons({ checkmarkCircleOutline, musicalNotesOutline, searchOutline, sparklesOutline });
  }

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (this.editing) this.step.set(2);
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
        this.loading.set(false);
      },
      error: () => { this.error.set('Impossibile caricare il brano.'); this.loading.set(false); },
    });
  }

  ngOnDestroy(): void {
    if (this.tapResetTimer) clearTimeout(this.tapResetTimer);
  }

  @HostListener('document:keydown', ['$event'])
  onTapTempoKeydown(event: KeyboardEvent): void {
    if (this.step() !== 2 || event.code !== 'Space' || event.repeat || this.isTypingTarget(event)) return;
    event.preventDefault();
    this.tapTempo();
  }

  tapTempo(): void {
    const now = performance.now();
    const previousTap = this.tapTimestamps[this.tapTimestamps.length - 1];
    if (!previousTap || now - previousTap > 2000) this.tapTimestamps = [];

    this.tapTimestamps.push(now);
    if (this.tapTimestamps.length > 9) this.tapTimestamps.shift();
    this.tapCount.set(this.tapTimestamps.length);

    if (this.tapTimestamps.length >= 2) {
      const intervals = this.tapTimestamps.slice(1).map((tap, index) => tap - this.tapTimestamps[index]);
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const bpm = Math.round(60000 / averageInterval);
      if (bpm >= 20 && bpm <= 300) {
        this.tappedBpm.set(bpm);
        this.form.controls.bpm.setValue(String(bpm));
      }
    }

    if (this.tapResetTimer) clearTimeout(this.tapResetTimer);
    this.tapResetTimer = setTimeout(() => this.resetTapTempo(), 2500);
  }

  private resetTapTempo(): void {
    this.tapTimestamps = [];
    this.tapCount.set(0);
    this.tappedBpm.set(null);
    this.tapResetTimer = undefined;
  }

  private isTypingTarget(event: KeyboardEvent): boolean {
    return event.composedPath().some((target) => target instanceof HTMLElement && (
      target.isContentEditable || target.matches('input, textarea, select, button, ion-input, ion-textarea, ion-select')
    ));
  }

  completeMetadataFromForm(): void {
    if (this.magicLoading()) return;

    const title = this.form.controls.title.value.trim();
    const artist = this.form.controls.performedBy.value.trim();

    this.magicError.set('');
    this.metadataResults.set([]);

    if (!title) {
      this.magicError.set('Inserisci almeno il titolo del brano.');
      return;
    }

    this.magicLoading.set(true);
    this.songs.searchMetadata(title, artist).pipe(
      finalize(() => this.magicLoading.set(false)),
    ).subscribe({
      next: (results) => {
        this.metadataResults.set(results);
        if (!results.length) {
          this.magicError.set('Nessun risultato trovato.');
        }
      },
      error: (error: { error?: { message?: string }; message?: string; status?: number }) => {
        const fallback = error.status === 0
          ? 'Backend non raggiungibile. Controlla che l’API sia avviata.'
          : 'Ricerca metadati non disponibile.';
        this.magicError.set(error.error?.message || error.message || fallback);
      },
    });
  }

  searchMagicSong(): void {
    if (this.magicForm.invalid || this.magicLoading()) { this.magicForm.markAllAsTouched(); return; }
    const values = this.magicForm.getRawValue();
    this.magicLoading.set(true);
    this.magicError.set('');
    this.metadataResults.set([]);
    this.songs.searchMetadata(values.title, values.artist).pipe(
      finalize(() => this.magicLoading.set(false)),
    ).subscribe({
      next: (results) => {
        this.metadataResults.set(results);
        if (!results.length) this.magicError.set('Nessun risultato trovato. Puoi continuare manualmente.');
      },
      error: (error: { error?: { message?: string }; message?: string; status?: number }) => {
        const fallback = error.status === 0
          ? 'Backend non raggiungibile. Controlla che l’API sia avviata.'
          : 'Ricerca metadati non disponibile. Puoi continuare manualmente.';
        this.magicError.set(error.error?.message || error.message || fallback);
      },
    });
  }

  chooseMetadata(candidate: SongMetadataCandidate): void {
    if (this.detailLoading()) return;
    this.selectedMetadata.set(candidate);
    this.metadataResults.set([]);
    this.applyMetadata(candidate);
    this.step.set(2);
    if (!candidate.recordingMbid) {
      return;
    }
    this.detailLoading.set(true);
    this.songs.metadataDetail(candidate.recordingMbid).pipe(
      finalize(() => this.detailLoading.set(false)),
    ).subscribe({
      next: (detail) => {
        // Preserve the Spotify source when the extra MusicBrainz detail call
        // does not carry the original provider identifiers.
        const selected = candidate.provider === 'spotify'
          ? { ...candidate, ...detail, provider: candidate.provider, externalId: candidate.externalId }
          : { ...candidate, ...detail };
        this.selectedMetadata.set(selected);
        this.applyMetadata(selected);
      },
      error: () => undefined,
    });
  }

  continueManually(): void {
    const values = this.magicForm.getRawValue();
    this.form.patchValue({ title: values.title, performedBy: values.artist });
    this.step.set(2);
  }

  goToStep(nextStep: number): void {
    if (nextStep === 3 && (this.form.controls.title.invalid || this.form.controls.duration.invalid)) {
      this.form.controls.title.markAsTouched();
      this.form.controls.duration.markAsTouched();
      return;
    }
    this.step.set(Math.max(1, Math.min(3, nextStep)));
  }

  save(addAnother = false): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); this.step.set(2); return; }
    this.saving.set(true);
    this.error.set('');
    const durationSeconds = this.parseDuration(this.form.getRawValue().duration);
    if (durationSeconds === null) {
      this.error.set('Inserisci una durata valida nel formato mm:ss.');
      this.saving.set(false);
      this.step.set(2);
      return;
    }
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
    request.subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Brano salvato.', duration: 1800, color: 'success' })).present();
        if (addAnother && !this.editing) {
          this.prepareNextSong();
          return;
        }
        void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/repertorio` : '/band');
      },
      error: (error: Error) => {
        this.error.set(error.message || 'Salvataggio non riuscito.');
        this.saving.set(false);
      },
    });
  }

  private prepareNextSong(): void {
    this.form.reset({
      title: '', album: '', performedBy: '', musicBy: '', lyricsBy: '', key: '', bpm: '', duration: '',
      linkGroup: '', tagsText: '', status: 'draft', notes: '',
    });
    this.magicForm.reset({ title: '', artist: '' });
    this.metadataResults.set([]);
    this.selectedMetadata.set(null);
    this.error.set('');
    this.magicError.set('');
    this.creatingLinkGroup = false;
    this.resetTapTempo();
    this.saving.set(false);
    this.step.set(1);
  }

  private applyMetadata(metadata: SongMetadataCandidate | SongMetadataDetail): void {
    const detail = metadata as SongMetadataDetail;
    const musicCredits = (detail.credits ?? []).filter((credit) => ['composer', 'writer'].includes(credit.role.toLowerCase())).map((credit) => credit.name);
    const lyricCredits = (detail.credits ?? []).filter((credit) => ['lyricist', 'writer'].includes(credit.role.toLowerCase())).map((credit) => credit.name);
    this.form.patchValue({
      title: metadata.title,
      performedBy: metadata.artist ?? '',
      album: metadata.album ?? '',
      duration: this.formatDuration(metadata.durationSeconds),
      bpm: detail.bpm != null ? String(detail.bpm) : '',
      musicBy: Array.from(new Set(musicCredits)).join(', '),
      lyricsBy: Array.from(new Set(lyricCredits)).join(', '),
    });
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

  onLinkGroupChoice(event: CustomEvent<{ value: string }>): void {
    const value = event.detail.value;
    this.creatingLinkGroup = value === '__new__';
    this.form.patchValue({ linkGroup: this.creatingLinkGroup ? '' : value });
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
