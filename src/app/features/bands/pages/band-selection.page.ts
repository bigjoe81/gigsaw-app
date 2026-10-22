import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { DialogService } from '../../../shared/ui/native-ui';
import { Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import {
  GigsawMessageComponent,
} from '../../../shared/ui/gigsaw';
import { Band } from '../models/band.models';
import { BandService } from '../services/band.service';
import { BandCreatePage } from './band-create.page';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, BandCreatePage,
    GigsawMessageComponent,
    ],
  templateUrl: './band-selection.page.html',
  styleUrls: ['./band-selection.page.scss'],
})
export class BandSelectionPage {
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(DialogService);
  private readonly onboarding = inject(OnboardingService);

  readonly bands = signal<Band[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly createModalOpen = signal(false);

  constructor() {

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.bandService.listUserBands().subscribe({
      next: (bands) => {
        this.bands.set(bands);
        this.loading.set(false);
        if (!bands.length && this.route.snapshot.queryParamMap.get('seleziona') !== '1') {
          void this.router.navigate(['/inizia'], { queryParams: { mode: 'create' } });
        } else if (bands.length && this.onboarding.shouldShow()) {
          this.onboarding.complete();
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Impossibile caricare le band.');
        this.loading.set(false);
      },
    });
  }

  selectBand(band: Band): void {
    this.bandContext.setCurrentBand(band.id);
    void this.router.navigateByUrl(`/band/${band.id}/panoramica`);
  }

  formatGenres(band: Band): string {
    const genres = band.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
    return genres.length ? genres.join(' · ') : 'Apri workspace';
  }

  async promptJoinBand(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Entra in una band',
      message: 'Inserisci il codice band condiviso da un membro esistente.',
      inputs: [
        {
          name: 'joinCode',
          type: 'text',
          placeholder: 'Es. A1B2C3D4',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Entra',
          handler: (value) => {
            const joinCode = String(value?.['joinCode'] ?? '').trim();
            if (!joinCode) {
              this.error.set('Inserisci un codice band valido.');
              return false;
            }

            this.joinBand(joinCode);
            return true;
          },
        },
      ],
    });

    await dialog.present();
  }

  joinBand(joinCode: string): void {
    this.loading.set(true);
    this.error.set('');

    this.bandService.join(joinCode).subscribe({
      next: (band) => {
        this.loading.set(false);
        this.bandContext.setCurrentBand(band.id);
        void this.router.navigateByUrl(`/band/${band.id}/repertorio`);
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.loading.set(false);
        this.error.set(error.error?.errors?.['join_code']?.[0] || error.error?.message || 'Impossibile entrare nella band.');
      },
    });
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  openOnboarding(): void {
    void this.router.navigate(['/inizia'], { queryParams: { ripeti: 1 } });
  }

  async onBandCreated(band: Band): Promise<void> {
    this.createModalOpen.set(false);
    this.bandContext.setCurrentBand(band.id);
    await this.router.navigateByUrl(`/band/${band.id}/impostazioni`);
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
