import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NativeUiModule, ToastService } from '../../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../../shared/ui/gigsaw/gigsaw-form-controls.module';

import { Band, BandPressPhoto } from '../../models/band.models';
import { BandService } from '../../services/band.service';
import { BandPressKitService } from '../../services/band-press-kit.service';
import { BandMediaPackService } from '../../services/band-media-pack.service';

@Component({
  selector: 'app-band-media-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [NativeUiModule, GigsawFormControlsModule],
  templateUrl: './band-media-settings.component.html',
  styleUrl: './band-media-settings.component.scss',
})
export class BandMediaSettingsComponent {
  @Input({ required: true }) band!: Band;
  @Output() readonly bandChange = new EventEmitter<Band>();
  private readonly bandService = inject(BandService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private get bandId(): number {
    return this.band.id;
  }
  private readonly pressKitService = inject(BandPressKitService);
  private readonly mediaPackService = inject(BandMediaPackService);
  selectedPressPhotos: File[] = [];
  uploadingPressPhotos = false;
  onPressPhotoFilesSelected(files: File[]): void {
    this.selectedPressPhotos = files;
  }

  uploadPressPhotos(): void {
    if (!this.band || !this.selectedPressPhotos.length || this.uploadingPressPhotos) {
      return;
    }

    this.uploadingPressPhotos = true;
    this.bandService
      .uploadPressPhotos(this.bandId, this.selectedPressPhotos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (band) => {
          this.band = band;
          this.bandChange.emit(band);
          this.selectedPressPhotos = [];
          this.uploadingPressPhotos = false;
          (await this.toast.create({ message: 'Foto promo caricate.', duration: 1800, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string } }) => {
          this.uploadingPressPhotos = false;
          (
            await this.toast.create({
              message: error.error?.message || 'Upload foto promo non riuscito.',
              duration: 2200,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  removePressPhoto(photo: BandPressPhoto): void {
    if (!this.band) return;

    this.bandService
      .deletePressPhoto(this.bandId, photo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          this.band = {
            ...this.band!,
            pressPhotos: (this.band?.pressPhotos ?? []).filter((item) => item.id !== photo.id),
          };
          this.bandChange.emit(this.band);
          (await this.toast.create({ message: 'Foto promo rimossa.', duration: 1600, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string } }) => {
          (
            await this.toast.create({
              message: error.error?.message || 'Rimozione foto non riuscita.',
              duration: 2200,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  async exportPressKit(): Promise<void> {
    if (!this.band) return;
    await this.pressKitService.openPdf(this.bandId, `${this.band.name} press kit`);
  }

  async sharePressKit(): Promise<void> {
    if (!this.band) return;
    await this.pressKitService.sharePdf(this.bandId, `${this.band.name} press kit`);
  }

  async exportMediaPack(): Promise<void> {
    if (!this.band) return;
    await this.mediaPackService.downloadZip(this.bandId, `${this.band.name} media pack`);
  }

  async shareMediaPack(): Promise<void> {
    if (!this.band) return;
    await this.mediaPackService.shareZip(this.bandId, `${this.band.name} media pack`);
  }
}
