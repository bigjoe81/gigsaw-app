import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonMenuButton,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Band, BandEmailNotificationSettings, BandNotificationAudience } from '../models/band.models';
import { BandService } from '../services/band.service';
import { BandContextService } from '../../../core/services/band-context.service';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonMenuButton,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
  templateUrl: './band-notification-settings.page.html',
  styleUrl: './band-notification-settings.page.scss',
})
export class BandNotificationSettingsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  band?: Band;
  private bandId = 0;

  readonly form = this.fb.nonNullable.group({
    enabled: [false],
    recipients: ['all' as BandNotificationAudience],
    userIds: [[] as number[]],
    events: this.fb.nonNullable.group({
      rehearsalCreated: [true],
      rehearsalUpdated: [true],
      rehearsalCancelled: [true],
      rehearsalDeleted: [true],
      gigCreated: [true],
      gigUpdated: [true],
      gigDeleted: [true],
      memberInvited: [true],
    }),
  });

  constructor() {
    const bandId = Number(this.route.snapshot.parent?.parent?.paramMap.get('bandId')
      ?? this.route.snapshot.parent?.paramMap.get('bandId')
      ?? this.route.snapshot.paramMap.get('bandId'));

    if (!Number.isInteger(bandId) || bandId <= 0) {
      this.error.set('Band non trovata.');
      this.loading.set(false);
      return;
    }

    this.bandId = bandId;
    this.bandContext.setCurrentBand(bandId);
    this.load();
  }

  get settingsUrl(): string {
    return `/band/${this.bandId}/impostazioni`;
  }

  get showMemberPicker(): boolean {
    return this.form.controls.recipients.value === 'selected';
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      band: this.bandService.get(this.bandId),
      settings: this.bandService.getNotificationSettings(this.bandId),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ band, settings }) => {
        if (band.currentUserRole !== 'ADMIN') {
          void this.router.navigateByUrl(this.settingsUrl, { replaceUrl: true });
          return;
        }

        this.band = band;
        this.patch(settings);
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Impossibile caricare le notifiche della band.');
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.error.set('');

    const value = this.form.getRawValue();
    const settings: BandEmailNotificationSettings = {
      enabled: value.enabled,
      recipients: value.recipients,
      userIds: value.recipients === 'selected' ? value.userIds : [],
      events: value.events,
    };

    this.bandService.updateNotificationSettings(this.bandId, settings).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: async (saved) => {
        this.patch(saved);
        const toast = await this.toast.create({
          message: 'Preferenze email salvate.',
          duration: 1800,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Impossibile salvare le preferenze email.');
      },
    });
  }

  private patch(settings: BandEmailNotificationSettings): void {
    this.form.patchValue({
      enabled: settings.enabled,
      recipients: settings.recipients,
      userIds: settings.userIds,
      events: settings.events,
    });
  }
}
