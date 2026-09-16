import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmark,
  close,
  cloudUploadOutline,
  imageOutline,
  musicalNotesOutline,
  peopleOutline,
  settingsOutline,
} from 'ionicons/icons';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band, BandGenre } from '../models/band.models';
import { BandService } from '../services/band.service';
import { GenreService } from '../services/genre.service';

@Component({
  selector: 'app-band-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './band-create.page.html',
  styleUrls: ['./band-create.page.scss'],
})
export class BandCreatePage implements OnDestroy {
  private static readonly GENRE_SEARCH_MIN_LENGTH = 3;
  private static readonly GENRE_RESULT_LIMIT = 40;
  private readonly fb = inject(FormBuilder);
  private readonly bandService = inject(BandService);
  private readonly genreService = inject(GenreService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    genres: [[] as number[]],
    genreSearch: [''],
    bioShort: ['', Validators.maxLength(500)],
  });

  readonly saving = signal(false);
  error = '';
  readonly genresLoading = signal(true);
  genresError = '';
  availableGenres: BandGenre[] = [];
  selectedLogoFile: File | null = null;
  logoPreviewUrl = '';
  logoError = '';

  @Input() embedded = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() created = new EventEmitter<Band>();

  constructor() {
    console.log('[BandCreatePage] Componente istanziato');
    addIcons({
      arrowBackOutline,
      checkmark,
      close,
      cloudUploadOutline,
      imageOutline,
      musicalNotesOutline,
      peopleOutline,
      settingsOutline,
    });
    this.loadGenres();
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get bioLength(): number {
    return this.form.controls.bioShort.value?.length ?? 0;
  }

  get genreSearchQuery(): string {
    return this.normalizeGenreSearch(this.form.controls.genreSearch.value ?? '');
  }

  get canSearchGenres(): boolean {
    return this.genreSearchQuery.length >= BandCreatePage.GENRE_SEARCH_MIN_LENGTH;
  }

  get selectedGenres(): BandGenre[] {
    const genresById = new Map(this.availableGenres.map((genre) => [genre.id, genre]));
    return (this.form.controls.genres.value ?? [])
      .map((genreId) => genresById.get(genreId))
      .filter((genre): genre is BandGenre => Boolean(genre));
  }

  get filteredGenres(): BandGenre[] {
    if (!this.canSearchGenres) {
      return [];
    }

    const query = this.genreSearchQuery;
    const selectedIds = new Set(this.form.controls.genres.value ?? []);
    return this.availableGenres
      .filter((genre) => !selectedIds.has(genre.id as number))
      .filter((genre) => this.normalizeGenreSearch(genre.name ?? '').includes(query))
      .slice(0, BandCreatePage.GENRE_RESULT_LIMIT);
  }

  loadGenres(): void {
    console.log('[BandCreatePage] Caricamento generi avviato');
    this.genresLoading.set(true);
    this.genresError = '';

    this.genreService.list().subscribe({
      next: (genres) => {
        console.log('[BandCreatePage] Risposta generi ricevuta', {
          received: genres.length,
        });
        this.availableGenres = genres.filter((genre) => Number.isInteger(genre.id) && Boolean(genre.name));
        console.log('[BandCreatePage] Generi validi caricati', {
          available: this.availableGenres.length,
        });
        this.genresLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('[BandCreatePage] Errore durante il caricamento dei generi', error);
        this.genresError = 'Non riesco a caricare i generi. Puoi comunque creare la band.';
        this.genresLoading.set(false);
      },
    });
  }

  toggleGenre(genreId: number | undefined): void {
    if (!Number.isInteger(genreId)) {
      return;
    }

    const id = genreId as number;
    const selected = this.form.controls.genres.value ?? [];
    this.form.controls.genres.setValue(
      selected.includes(id) ? selected.filter((selectedId) => selectedId !== id) : [...selected, id],
    );
    this.form.controls.genres.markAsDirty();
  }

  isGenreSelected(genreId: number | undefined): boolean {
    return Number.isInteger(genreId) && (this.form.controls.genres.value ?? []).includes(genreId as number);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.logoError = 'Usa un file JPG, PNG o WebP.';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.logoError = 'Il logo supera 2 MB. Scegli un file più leggero.';
      return;
    }

    this.clearLogoPreview();
    this.selectedLogoFile = file;
    this.logoPreviewUrl = URL.createObjectURL(file);
    this.logoError = '';
  }

  removeLogo(): void {
    this.clearLogoPreview();
    this.selectedLogoFile = null;
    this.logoError = '';
  }

  cancel(): void {
    if (this.saving()) {
      return;
    }

    if (this.embedded) {
      this.cancelled.emit();
      return;
    }

    void this.router.navigateByUrl('/bands');
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error = '';
    const values = this.form.getRawValue();

    this.bandService.create({
      name: values.name?.trim() ?? '',
      genres: values.genres ?? [],
      bioShort: values.bioShort?.trim() || null,
      logo: this.selectedLogoFile,
    }).subscribe({
      next: (band) => {
        this.bandContext.setCurrentBand(band.id);
        if (this.embedded) {
          this.saving.set(false);
          this.created.emit(band);
          return;
        }
        void this.router.navigateByUrl(`/band/${band.id}/band`);
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.error = error.error?.errors?.['name']?.[0]
          || error.error?.errors?.['logo']?.[0]
          || error.error?.message
          || 'Creazione band non riuscita. Riprova tra poco.';
        this.saving.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearLogoPreview();
  }

  private clearLogoPreview(): void {
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.logoPreviewUrl = '';
    }
  }

  private normalizeGenreSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('it');
  }
}
