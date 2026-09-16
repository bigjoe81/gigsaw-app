
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { RehearsalRoom, Venue } from '../../../core/models/band-resources.models';
import { RehearsalRoomService } from '../../rehearsal-sessions/services/rehearsal-room.service';
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
  kind: 'venue' | 'room' = 'venue';

  constructor(private readonly fb: FormBuilder, private readonly venues: VenueService, private readonly rehearsalRooms: RehearsalRoomService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.kind = this.route.snapshot.url[0]?.path === 'room' ? 'room' : 'venue';
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (this.id) {
      const request: Observable<Venue | RehearsalRoom> = this.kind === 'venue' ? this.venues.get(this.id) : this.rehearsalRooms.get(this.id);
      request.subscribe({ next: (location: Venue | RehearsalRoom) => this.form.patchValue({ name: location.name, address: location.address ?? '', city: location.city ?? '', latitude: location.latitude != null ? String(location.latitude) : '', longitude: location.longitude != null ? String(location.longitude) : '' }), error: () => this.error = 'Impossibile caricare il luogo.' });
    }
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Partial<Venue & RehearsalRoom> = {
      ...this.form.getRawValue(),
      latitude: this.toNumber(this.form.getRawValue().latitude),
      longitude: this.toNumber(this.form.getRawValue().longitude),
    };
    const service = this.kind === 'venue' ? this.venues : this.rehearsalRooms;
    const request: Observable<Venue | RehearsalRoom> = this.editing ? service.update(this.id!, payload) : service.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Luogo salvato.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/locations` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
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
