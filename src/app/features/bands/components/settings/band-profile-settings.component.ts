import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NativeUiModule, ToastService } from '../../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { GigsawBadgeComponent, GigsawTypeaheadComponent, GigsawTypeaheadItem } from '../../../../shared/ui/gigsaw';
import { Band, BandGenre, UpdateBandRequest } from '../../models/band.models';
import { BandService } from '../../services/band.service';
import { GenreService } from '../../services/genre.service';

@Component({
  selector: 'app-band-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    NativeUiModule,
    GigsawFormControlsModule,
    ReactiveFormsModule,
    GigsawTypeaheadComponent,
    GigsawBadgeComponent,
  ],
  templateUrl: './band-profile-settings.component.html',
  styleUrl: './band-profile-settings.component.scss',
})
export class BandProfileSettingsComponent implements OnChanges, OnInit, OnDestroy {
  @Input({ required: true }) band!: Band;
  @Output() readonly bandChange = new EventEmitter<Band>();
  private readonly bandService = inject(BandService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private get bandId(): number {
    return this.band.id;
  }
  private readonly fb = inject(FormBuilder);
  readonly genreQuery = signal('');

  get genreTypeaheadItems(): GigsawTypeaheadItem[] {
    const selected = new Set(this.profileForm.controls.genres.value);
    return this.availableGenres
      .filter((genre): genre is BandGenre & { id: number; name: string } => Number.isInteger(genre.id) && !!genre.name)
      .filter((genre) => !selected.has(genre.id))
      .map((genre) => ({ id: genre.id, label: genre.name, data: genre }));
  }
  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    genres: [[] as number[]],
    bioShort: [''],
    bio: [''],
    city: [''],
    country: [''],
    email: ['', Validators.email],
    phone: [''],
    website: [''],
    instagramUrl: [''],
    facebookUrl: [''],
    youtubeUrl: [''],
    spotifyUrl: [''],
    tiktokUrl: [''],
  });

  private readonly genreService = inject(GenreService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  availableGenres: BandGenre[] = [];
  savingProfile = false;
  profileError = '';
  selectedLogoFile: File | null = null;
  readonly logoPreviewUrl = signal('');
  readonly logoError = signal('');
  ngOnChanges(changes: SimpleChanges): void {
    const previous = changes['band']?.previousValue as Band | undefined;
    if (previous?.id !== this.band.id || !this.profileForm.dirty) this.patchProfileForm(this.band);
  }
  ngOnInit(): void {
    this.genreService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (genres) => {
          this.availableGenres = genres;
        },
      });
  }
  ngOnDestroy(): void {
    this.clearLogoPreview();
  }
  patchProfileForm(band: Band): void {
    this.profileForm.patchValue({
      name: band.name ?? '',
      genres: (band.genres ?? []).map((genre) => genre.id).filter((id): id is number => Number.isInteger(id)),
      bioShort: band.bioShort ?? '',
      bio: band.bio ?? '',
      city: band.city ?? '',
      country: band.country ?? '',
      email: band.email ?? '',
      phone: band.phone ?? '',
      website: band.website ?? '',
      instagramUrl: band.instagramUrl ?? '',
      facebookUrl: band.facebookUrl ?? '',
      youtubeUrl: band.youtubeUrl ?? '',
      spotifyUrl: band.spotifyUrl ?? '',
      tiktokUrl: band.tiktokUrl ?? '',
    });
  }

  onLogoFilesSelected(files: File[]): void {
    const file = files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.logoError.set('Scegli un file JPG, PNG o WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.logoError.set('Il logo supera 2 MB. Scegli un file più leggero.');
      return;
    }
    this.clearLogoPreview();
    this.selectedLogoFile = file;
    this.logoPreviewUrl.set(URL.createObjectURL(file));
    this.logoError.set('');
    this.profileForm.markAsDirty();
  }

  private clearLogoPreview(): void {
    const url = this.logoPreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.logoPreviewUrl.set('');
  }

  selectGenre(item: GigsawTypeaheadItem): void {
    const genreId = Number(item.id);
    if (!Number.isInteger(genreId) || this.profileForm.controls.genres.value.includes(genreId)) return;
    this.profileForm.controls.genres.setValue([...this.profileForm.controls.genres.value, genreId]);
    this.profileForm.controls.genres.markAsDirty();
    this.genreQuery.set('');
  }

  removeGenre(genreId: number | undefined): void {
    if (!Number.isInteger(genreId)) return;
    this.profileForm.controls.genres.setValue(this.profileForm.controls.genres.value.filter((id) => id !== genreId));
    this.profileForm.controls.genres.markAsDirty();
  }

  saveProfile(): void {
    if (!this.band || this.profileForm.invalid || this.savingProfile) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    const values = this.profileForm.getRawValue();
    const payload: UpdateBandRequest = {
      name: values.name.trim(),
      genres: values.genres,
      logo: this.selectedLogoFile,
      bioShort: this.emptyToNull(values.bioShort),
      bio: this.emptyToNull(values.bio),
      city: this.emptyToNull(values.city),
      country: this.emptyToNull(values.country),
      email: this.emptyToNull(values.email),
      phone: this.emptyToNull(values.phone),
      website: this.emptyToNull(values.website),
      instagramUrl: this.emptyToNull(values.instagramUrl),
      facebookUrl: this.emptyToNull(values.facebookUrl),
      youtubeUrl: this.emptyToNull(values.youtubeUrl),
      spotifyUrl: this.emptyToNull(values.spotifyUrl),
      tiktokUrl: this.emptyToNull(values.tiktokUrl),
    };

    this.bandService
      .update(this.bandId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (band) => {
          this.band = band;
          this.bandChange.emit(band);
          this.patchProfileForm(band);
          this.profileForm.markAsPristine();
          this.selectedLogoFile = null;
          this.clearLogoPreview();
          this.savingProfile = false;
          this.changeDetector.markForCheck();
          (await this.toast.create({ message: 'Profilo band salvato.', duration: 1800, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string; errors?: Record<string, string[]> } }) => {
          this.savingProfile = false;
          this.profileError =
            Object.values(error.error?.errors ?? {}).find((messages) => messages.length)?.[0] ||
            error.error?.message ||
            'Salvataggio profilo non riuscito.';
          this.changeDetector.markForCheck();
          (await this.toast.create({ message: this.profileError, duration: 2200, color: 'danger' })).present();
        },
      });
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  get selectedGenres(): BandGenre[] {
    const selected = new Set(this.profileForm.controls.genres.value);
    return this.availableGenres.filter((genre) => genre.id !== undefined && selected.has(genre.id));
  }
}
