import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Commitment, CommitmentStatus, CommitmentType } from '../../../core/models/band-resources.models';
import { BandContextService } from '../../../core/services/band-context.service';
import { CommitmentService } from '../services/commitment.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './commitment-form.page.html',
  styleUrls: ['./commitment-form.page.scss'],
})
export class CommitmentFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CommitmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  private readonly alert = inject(AlertController);
  private readonly bandContext = inject(BandContextService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editing = signal(false);
  private id?: number;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['other' as CommitmentType, Validators.required],
    date: [this.today(), Validators.required],
    startTime: '',
    endTime: '',
    location: '',
    status: ['scheduled' as CommitmentStatus, Validators.required],
    notes: '',
  });

  ionViewWillEnter(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.id = id;
    this.editing.set(Boolean(id));
    if (!id) return;

    this.loading.set(true);
    this.api.get(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (item) => this.form.patchValue({
        title: item.title,
        type: item.type,
        date: String(item.date).slice(0, 10),
        startTime: item.startTime ? String(item.startTime).slice(0, 5) : '',
        endTime: item.endTime ? String(item.endTime).slice(0, 5) : '',
        location: item.location ?? '',
        status: item.status,
        notes: item.notes ?? '',
      }),
      error: (error) => this.error.set(this.message(error, 'Impossibile caricare l’impegno.')),
    });
  }

  save(): void {
    this.error.set('');
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      this.error.set('L’orario di fine deve essere successivo all’orario di inizio.');
      return;
    }

    const payload: Partial<Commitment> = {
      title: value.title.trim(),
      type: value.type,
      date: value.date,
      startTime: value.startTime || null,
      endTime: value.endTime || null,
      location: value.location.trim() || null,
      status: value.status,
      notes: value.notes.trim() || null,
    };

    this.saving.set(true);
    const request = this.editing() ? this.api.update(this.id!, payload) : this.api.create(payload);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Impegno salvato.', duration: 1600, color: 'success' })).present();
        void this.router.navigateByUrl(this.listUrl);
      },
      error: (error) => this.error.set(this.message(error, 'Salvataggio non riuscito.')),
    });
  }

  async remove(): Promise<void> {
    if (!this.id) return;
    const dialog = await this.alert.create({
      header: 'Eliminare l’impegno?',
      message: 'L’impegno verrà rimosso dal calendario.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.deleteNow() },
      ],
    });
    await dialog.present();
  }

  private deleteNow(): void {
    if (!this.id) return;
    this.api.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Impegno eliminato.', duration: 1600, color: 'success' })).present();
        void this.router.navigateByUrl(this.listUrl);
      },
      error: () => this.error.set('Impossibile eliminare l’impegno.'),
    });
  }

  get listUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}/impegni` : '/band';
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private message(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const errors = error.error?.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors).find((messages) => messages.length)?.[0] : undefined;
      return firstError || error.error?.message || fallback;
    }
    return fallback;
  }
}
