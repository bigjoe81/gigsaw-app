
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { BandContextService } from '../../../core/services/band-context.service';
import { BandService } from '../services/band.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './band-create.page.html',
})
export class BandCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    name: ['', Validators.required],
  });

  saving = false;
  error = '';

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    this.bandService.create({ name: this.form.getRawValue().name ?? '' }).subscribe({
      next: (band) => {
        this.bandContext.setCurrentBand(band.id);
        void this.router.navigateByUrl(`/band/${band.id}/repertorio`);
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message || 'Creazione band non riuscita.';
        this.saving = false;
      },
    });
  }
}
