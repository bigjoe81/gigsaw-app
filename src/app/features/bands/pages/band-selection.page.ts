
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController, IonButton, IonButtons,
  IonContent, IonHeader,
  IonIcon,
  IonMenu, IonMenuButton, IonSplitPane, IonTitle, IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  close,
  cloudUploadOutline,
  helpCircleOutline,
  imageOutline,
  logOutOutline,
  musicalNotes,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import {
  DaisyButtonComponent,
  DaisyCheckboxComponent,
  DaisyInputComponent,
  DaisyLoadingComponent,
  DaisyMessageComponent,
  DaisySelectComponent,
  DaisyStepItem,
  DaisyStepsComponent,
} from '../../../shared/ui/daisyui';
import { Band } from '../models/band.models';
import { BandService } from '../services/band.service';

interface CreateBandFormValue {
  name: string;
  genres: string[];
  city: string;
  owner: boolean;
}

@Component({
  standalone: true,
  imports: [
    DaisyButtonComponent,
    DaisyCheckboxComponent,
    DaisyInputComponent,
    DaisyLoadingComponent,
    DaisyMessageComponent,
    DaisySelectComponent,
    DaisyStepsComponent,
    IonContent,
    IonIcon,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonSplitPane,
    IonButton,
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
  private readonly menu = inject(MenuController);

  readonly bands = signal<Band[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  saving = false;
  createError = '';
  readonly createSteps: DaisyStepItem[] = [
    { label: 'Crea la band', active: true },
    { label: 'Invita i membri' },
  ];

  readonly createForm = signal<CreateBandFormValue>({
    name: 'Big Joe & The Rollers',
    genres: ['Blues', "Rock'n'roll"],
    city: 'Milano',
    owner: true,
  });
  readonly createFormTouched = signal(false);
  readonly createFormValid = computed(() => this.createForm().name.trim().length > 0);

  constructor() {
    addIcons({
      add,
      calendarOutline,
      close,
      cloudUploadOutline,
      helpCircleOutline,
      imageOutline,
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
    void this.router.navigateByUrl(`/band/${band.id}/dashboard`);
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

  openCreatePanel(): void {
    void this.menu.open('create-band-panel');
  }

  closeCreatePanel(): void {
    void this.menu.close('create-band-panel');
  }

  updateCreateName(name: string): void {
    this.createForm.update((form) => ({ ...form, name }));
  }

  updateCreateGenres(genres: string | string[]): void {
    this.createForm.update((form) => ({
      ...form,
      genres: Array.isArray(genres) ? genres : [genres].filter(Boolean),
    }));
  }

  updateCreateCity(city: string): void {
    this.createForm.update((form) => ({ ...form, city }));
  }

  updateCreateOwner(owner: boolean): void {
    this.createForm.update((form) => ({ ...form, owner }));
  }

  createBand(): void {
    this.createFormTouched.set(true);

    if (!this.createFormValid() || this.saving) {
      return;
    }

    this.saving = true;
    this.createError = '';

    this.bandService.create({ name: this.createForm().name.trim() }).subscribe({
      next: (band) => {
        this.saving = false;
        this.bandContext.setCurrentBand(band.id);
        void this.menu.close('create-band-panel');
        void this.router.navigateByUrl(`/band/${band.id}/dashboard`);
      },
      error: (error: { error?: { message?: string } }) => {
        this.saving = false;
        this.createError = error.error?.message || 'Creazione band non riuscita.';
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
