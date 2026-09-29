import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, musicalNotesOutline, navigateOutline } from 'ionicons/icons';
import { finalize, Observable } from 'rxjs';
import { RehearsalRoom, Venue } from '../../../core/models/band-resources.models';
import { GigsawButtonComponent, GigsawInputComponent, GigsawLoadingComponent, GigsawMessageComponent } from '../../../shared/ui/gigsaw';
import { RehearsalRoomService } from '../../rehearsal-sessions/services/rehearsal-room.service';
import { VenueService } from '../services/venue.service';
import { MapboxGeocodingService } from '../services/mapbox-geocoding.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, GigsawButtonComponent, GigsawInputComponent, GigsawLoadingComponent, GigsawMessageComponent, IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  templateUrl: './venue-form.page.html',
  styleUrls: ['./venue-form.page.scss'],
})
export class VenueFormPage implements OnInit {
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    latitude: '',
    longitude: '',
  });
  editing = false;
  loading = false;
  saving = false;
  geocoding = false;
  geocodeMessage = '';
  error = '';
  kind: 'venue' | 'room' = 'venue';
  private id?: number;
  private bandId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly venues: VenueService,
    private readonly rehearsalRooms: RehearsalRoomService,
    private readonly mapbox: MapboxGeocodingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {
    addIcons({ businessOutline, musicalNotesOutline, navigateOutline });
  }

  get locationLabel(): string {
    return this.kind === 'venue' ? 'venue' : 'sala prove';
  }

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.kind = ['sala', 'room'].includes(this.route.snapshot.url[0]?.path) ? 'room' : 'venue';
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    if (!this.id) return;

    this.loading = true;
    const request: Observable<Venue | RehearsalRoom> = this.kind === 'venue' ? this.venues.get(this.id) : this.rehearsalRooms.get(this.id);
    request.pipe(finalize(() => this.loading = false)).subscribe({
      next: (location) => this.form.patchValue({
        name: location.name,
        address: location.address ?? '',
        city: location.city ?? '',
        latitude: location.latitude != null ? String(location.latitude) : '',
        longitude: location.longitude != null ? String(location.longitude) : '',
      }),
      error: (error: unknown) => this.error = this.apiErrorMessage(error, 'Impossibile caricare il luogo.'),
    });
  }

  save(): void {
    this.error = '';
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      if (this.form.invalid) this.error = 'Completa tutti i campi obbligatori prima di salvare.';
      return;
    }

    this.saving = true;
    const values = this.form.getRawValue();
    const payload: Partial<Venue & RehearsalRoom> = {
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      latitude: this.toNumber(values.latitude),
      longitude: this.toNumber(values.longitude),
    };
    const service = this.kind === 'venue' ? this.venues : this.rehearsalRooms;
    const request: Observable<Venue | RehearsalRoom> = this.editing ? service.update(this.id!, payload) : service.create(payload);
    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: async () => {
        (await this.toast.create({ message: `${this.kind === 'venue' ? 'Venue salvata' : 'Sala prove salvata'}.`, duration: 1800, color: 'success' })).present();
        void this.navigateToList();
      },
      error: (error: unknown) => this.error = this.apiErrorMessage(error, 'Salvataggio non riuscito.'),
    });
  }

  geocodeAddress(): void {
    this.geocodeMessage = '';
    this.form.controls.address.markAsTouched();
    this.form.controls.city.markAsTouched();
    if (this.form.controls.address.invalid || this.form.controls.city.invalid) {
      this.geocodeMessage = 'Inserisci indirizzo e città prima di cercare le coordinate.';
      return;
    }
    if (!this.mapbox.isConfigured()) {
      this.geocodeMessage = 'La ricerca geografica non è configurata: aggiungi il token Mapbox negli environment.';
      return;
    }

    const { address, city } = this.form.getRawValue();
    this.geocoding = true;
    this.mapbox.search(`${address}, ${city}`).pipe(
      finalize(() => this.geocoding = false),
    ).subscribe({
      next: (results) => {
        const result = results.find((item) => item.latitude != null && item.longitude != null);
        if (!result) {
          this.geocodeMessage = 'Nessuna coordinata trovata per questo indirizzo.';
          return;
        }
        this.form.patchValue({
          latitude: String(result.latitude),
          longitude: String(result.longitude),
        });
        this.form.controls.latitude.markAsTouched();
        this.form.controls.longitude.markAsTouched();
        this.geocodeMessage = 'Coordinate ricavate dall’indirizzo.';
      },
      error: () => this.geocodeMessage = 'Impossibile ricavare le coordinate. Riprova tra poco.',
    });
  }

  cancel(): void {
    void this.navigateToList();
  }

  private navigateToList(): Promise<boolean> {
    return this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/luoghi` : '/band');
  }

  private toNumber(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const validationErrors = error.error?.errors as Record<string, string[]> | undefined;
      const firstValidationError = validationErrors ? Object.values(validationErrors).find((messages) => messages.length)?.[0] : undefined;
      return firstValidationError || error.error?.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) return value;
    }
    return undefined;
  }
}
