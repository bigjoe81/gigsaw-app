
import { Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonContent, IonHeader,
  IonIcon,
  IonModal, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  helpCircleOutline,
  logOutOutline,
  musicalNotes,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import {
  DaisyButtonComponent,
  DaisyMessageComponent,
} from '../../../shared/ui/daisyui';
import { Band } from '../models/band.models';
import { BandService } from '../services/band.service';
import { BandCreatePage } from './band-create.page';

@Component({
  standalone: true,
  imports: [
    BandCreatePage,
    DaisyButtonComponent,
    DaisyMessageComponent,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonToolbar,
    IonTitle,
  ],
  templateUrl: './band-selection.page.html',
  styleUrls: ['./band-selection.page.scss'],
})
export class BandSelectionPage {
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertController);

  readonly bands = signal<Band[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly createModalOpen = signal(false);
  readonly createBandModal = viewChild<IonModal>('createBandModal');

  constructor() {
    addIcons({
      add,
      calendarOutline,
      helpCircleOutline,
      logOutOutline,
      musicalNotes,
      timeOutline,
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.bandService.listUserBands().subscribe({
      next: (bands) => {
        this.bands.set(bands);
        this.loading.set(false);
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
            const joinCode = String(value?.joinCode ?? '').trim();
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

  async onBandCreated(band: Band): Promise<void> {
    this.createModalOpen.set(false);
    await this.createBandModal()?.dismiss(band, 'created');
    this.bandContext.setCurrentBand(band.id);
    await this.router.navigateByUrl(`/band/${band.id}/impostazioni`);
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
