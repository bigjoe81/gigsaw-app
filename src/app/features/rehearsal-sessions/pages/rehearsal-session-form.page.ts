
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonNote, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { RehearsalSessionService } from '../services/rehearsal-session.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonNote, IonSpinner, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './rehearsal-session-form.page.html',
})
export class RehearsalSessionFormPage implements OnInit {
  form = this.fb.nonNullable.group({ title: ['', Validators.required], date: ['', Validators.required], startTime: '', endTime: '', rehearsalRoomId: '', notes: '' });
  editing = false;
  saving = false;
  error = '';
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly rehearsalSessions: RehearsalSessionService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (this.id) this.rehearsalSessions.get(this.id).subscribe({ next: (session) => this.form.patchValue({ title: session.title, date: session.date ?? '', startTime: session.startTime ?? '', endTime: session.endTime ?? '', rehearsalRoomId: session.rehearsalRoomId != null ? String(session.rehearsalRoomId) : '', notes: session.notes ?? '' }), error: () => this.error = 'Impossibile caricare la prova.' });
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Partial<RehearsalSession> = {
      ...this.form.getRawValue(),
      date: this.normalizeDate(this.form.controls.date.value),
      rehearsalRoomId: this.toNumber(this.form.getRawValue().rehearsalRoomId),
    };
    const request = this.editing ? this.rehearsalSessions.update(this.id!, payload) : this.rehearsalSessions.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Prova salvata.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/prove` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
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
