
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Venue } from '../../../core/models/band-resources.models';
import { VenueService } from '../services/venue.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './venue-form.page.html',
})
export class VenueFormPage implements OnInit {
  form = this.fb.nonNullable.group({ name: ['', Validators.required], address: '', city: '', latitude: '', longitude: '' });
  editing = false;
  saving = false;
  error = '';
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly venues: VenueService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (this.id) this.venues.get(this.id).subscribe({ next: (venue) => this.form.patchValue({ name: venue.name, address: venue.address ?? '', city: venue.city ?? '', latitude: venue.latitude != null ? String(venue.latitude) : '', longitude: venue.longitude != null ? String(venue.longitude) : '' }), error: () => this.error = 'Impossibile caricare la venue.' });
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Partial<Venue> = {
      ...this.form.getRawValue(),
      latitude: this.toNumber(this.form.getRawValue().latitude),
      longitude: this.toNumber(this.form.getRawValue().longitude),
    };
    const request = this.editing ? this.venues.update(this.id!, payload) : this.venues.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Venue salvata.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/repertorio` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
  }

  private toNumber(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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
