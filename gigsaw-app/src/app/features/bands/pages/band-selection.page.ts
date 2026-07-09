
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonButtons,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, chevronForward, musicalNotes, refresh } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band } from '../models/band.models';
import { BandService } from '../services/band.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonSpinner, IonText, IonTitle, IonToolbar],
  templateUrl: './band-selection.page.html',
  styleUrls: ['./band-selection.page.scss'],
})
export class BandSelectionPage {
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertController);

  bands: Band[] = [];
  loading = true;
  error = '';

  constructor() {
    addIcons({ add, chevronForward, musicalNotes, refresh });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.bandService.listUserBands().subscribe({
      next: (bands) => {
        this.bands = bands;
        this.loading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message || 'Impossibile caricare le band.';
        this.loading = false;
      },
    });
  }

  selectBand(band: Band): void {
    this.bandContext.setCurrentBand(band.id);
    void this.router.navigateByUrl(`/band/${band.id}/repertorio`);
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
              this.error = 'Inserisci un codice band valido.';
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
    this.loading = true;
    this.error = '';

    this.bandService.join(joinCode).subscribe({
      next: (band) => {
        this.loading = false;
        this.bandContext.setCurrentBand(band.id);
        void this.router.navigateByUrl(`/band/${band.id}/repertorio`);
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.loading = false;
        this.error = error.error?.errors?.['join_code']?.[0] || error.error?.message || 'Impossibile entrare nella band.';
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
