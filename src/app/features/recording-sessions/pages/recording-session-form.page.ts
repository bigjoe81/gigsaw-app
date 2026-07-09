
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonNote, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { RecordingSession } from '../../../core/models/band-resources.models';
import { RecordingSessionService } from '../services/recording-session.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonNote, IonSpinner, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './recording-session-form.page.html',
})
export class RecordingSessionFormPage implements OnInit {
  form = this.fb.nonNullable.group({ title: ['', Validators.required], date: ['', Validators.required], songId: '', location: '', takeNumber: '', audioUrl: '', notes: '' });
  editing = false;
  saving = false;
  error = '';
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly recordingSessions: RecordingSessionService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (this.id) this.recordingSessions.get(this.id).subscribe({ next: (session) => this.form.patchValue({ title: session.title, date: session.date ?? '', songId: session.songId != null ? String(session.songId) : '', location: session.location ?? '', takeNumber: session.takeNumber != null ? String(session.takeNumber) : '', audioUrl: session.audioUrl ?? '', notes: session.notes ?? '' }), error: () => this.error = 'Impossibile caricare la sessione.' });
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Partial<RecordingSession> = {
      ...this.form.getRawValue(),
      date: this.normalizeDate(this.form.controls.date.value),
      songId: this.toNumber(this.form.getRawValue().songId),
      takeNumber: this.toNumber(this.form.getRawValue().takeNumber),
    };
    const request = this.editing ? this.recordingSessions.update(this.id!, payload) : this.recordingSessions.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Sessione salvata.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/repertorio` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
  }

  private toNumber(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  onDateChange(event: CustomEvent<{ value?: string | string[] | null }>): void {
    this.form.patchValue({ date: this.normalizeDate(event.detail.value) }, { emitEvent: false });
  }

  private normalizeDate(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) {
      return this.normalizeDate(value[0]);
    }

    return value ? String(value).slice(0, 10) : '';
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
  }
}
