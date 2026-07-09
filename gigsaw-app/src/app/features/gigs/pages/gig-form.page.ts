
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonSearchbar, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { debounceTime, distinctUntilChanged, forkJoin, of, Subject, switchMap } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { Venue } from '../../venues/models/venue.models';
import { MapboxAddressSuggestion, MapboxGeocodingService } from '../../venues/services/mapbox-geocoding.service';
import { VenueService } from '../../venues/services/venue.service';
import { GigService } from '../services/gig.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonSearchbar, IonSpinner, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './gig-form.page.html',
  styles: [`.venue-results{margin:8px 16px 0;border:1px solid var(--ion-color-light-shade);border-radius:16px;overflow:hidden;}.venue-result-title{font-weight:600;}.venue-result-meta{display:block;font-size:.9rem;color:var(--ion-color-medium);margin-top:4px;}.venue-selection-note{display:block;padding:8px 16px 0;}.venue-actions{display:flex;gap:8px;flex-wrap:wrap;padding:8px 16px 0;}`],
})
export class GigFormPage implements OnInit {
  form = this.fb.nonNullable.group({ title: ['', Validators.required], date: ['', Validators.required], venueId: '', notes: '' });
  editing = false;
  saving = false;
  loadingVenues = true;
  searchingMapbox = false;
  error = '';
  venueQuery = '';
  venues: Venue[] = [];
  filteredVenues: Venue[] = [];
  mapboxResults: MapboxAddressSuggestion[] = [];
  selectedVenue?: Venue;
  pendingVenue?: MapboxAddressSuggestion;
  private id?: number;
  private bandId?: number;
  private readonly venueQueryChanges = new Subject<string>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly gigs: GigService,
    private readonly venuesApi: VenueService,
    private readonly mapbox: MapboxGeocodingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    this.bindVenueSearch();

    forkJoin({
      venues: this.venuesApi.list(),
      gig: this.id ? this.gigs.get(this.id) : of(undefined),
    }).subscribe({
      next: ({ venues, gig }) => {
        this.venues = venues;
        this.filteredVenues = venues;
        this.loadingVenues = false;

        if (gig) {
          this.form.patchValue({
            title: gig.title,
            date: gig.date ?? '',
            venueId: gig.venueId != null ? String(gig.venueId) : '',
            notes: gig.notes ?? '',
          });

          if (gig.venueId != null) {
            const venue = this.venues.find((item) => item.id === gig.venueId);
            if (venue) {
              this.selectExistingVenue(venue);
            }
          }
        }
      },
      error: () => {
        this.loadingVenues = false;
        this.error = this.id ? 'Impossibile caricare il concerto.' : 'Impossibile caricare le venue.';
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.resolveVenueIdForSave().pipe(
      switchMap((venueId) => {
        const payload: Partial<Gig> = {
          ...this.form.getRawValue(),
          date: this.normalizeDate(this.form.controls.date.value),
          venueId,
        };
        return this.editing ? this.gigs.update(this.id!, payload) : this.gigs.create(payload);
      }),
    ).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto salvato.', duration: 1800, color: 'success' })).present();
        void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/concerti` : '/bands');
      },
      error: (error: Error) => {
        this.error = error.message || 'Salvataggio non riuscito.';
        this.saving = false;
      },
    });
  }

  onVenueQueryInput(event: Event): void {
    const target = event.target as HTMLIonSearchbarElement | null;
    const value = target?.value?.toString() ?? '';
    this.venueQuery = value;
    this.selectedVenue = undefined;
    this.pendingVenue = undefined;
    this.form.patchValue({ venueId: '' }, { emitEvent: false });
    this.venueQueryChanges.next(value);
  }

  onDateChange(event: CustomEvent<{ value?: string | string[] | null }>): void {
    this.form.patchValue({ date: this.normalizeDate(event.detail.value) }, { emitEvent: false });
  }

  selectExistingVenue(venue: Venue): void {
    this.selectedVenue = venue;
    this.pendingVenue = undefined;
    this.venueQuery = this.venueLabel(venue);
    this.filteredVenues = [];
    this.mapboxResults = [];
    this.form.patchValue({ venueId: String(venue.id) }, { emitEvent: false });
  }

  selectMapboxResult(result: MapboxAddressSuggestion): void {
    const existingVenue = this.findMatchingVenue(result);
    if (existingVenue) {
      this.selectExistingVenue(existingVenue);
      return;
    }

    this.selectedVenue = undefined;
    this.pendingVenue = result;
    this.venueQuery = result.fullAddress;
    this.filteredVenues = [];
    this.mapboxResults = [];
    this.form.patchValue({ venueId: '' }, { emitEvent: false });
  }

  clearVenueSelection(): void {
    this.selectedVenue = undefined;
    this.pendingVenue = undefined;
    this.venueQuery = '';
    this.filteredVenues = this.venues;
    this.mapboxResults = [];
    this.form.patchValue({ venueId: '' }, { emitEvent: false });
  }

  venueLabel(venue: Venue): string {
    return [venue.name, venue.address, venue.city].filter(Boolean).join(' · ');
  }

  venueMeta(venue: Venue): string {
    return [venue.address, venue.city].filter(Boolean).join(' · ');
  }

  mapboxConfigured(): boolean {
    return this.mapbox.isConfigured();
  }

  private toNumber(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private bindVenueSearch(): void {
    this.venueQueryChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((query) => {
        const trimmed = query.trim();
        this.filteredVenues = this.filterVenues(trimmed);

        if (!this.mapbox.isConfigured() || trimmed.length < 3) {
          this.searchingMapbox = false;
          return of([] as MapboxAddressSuggestion[]);
        }

        this.searchingMapbox = true;
        return this.mapbox.search(trimmed);
      }),
    ).subscribe({
      next: (results) => {
        this.mapboxResults = results.filter((result) => !this.findMatchingVenue(result));
        this.searchingMapbox = false;
      },
      error: () => {
        this.mapboxResults = [];
        this.searchingMapbox = false;
      },
    });
  }

  private filterVenues(query: string): Venue[] {
    if (!query) {
      return this.venues.slice(0, 8);
    }

    const normalizedQuery = this.normalize(query);
    return this.venues
      .filter((venue) => this.normalize(this.venueLabel(venue)).includes(normalizedQuery))
      .slice(0, 8);
  }

  private findMatchingVenue(result: MapboxAddressSuggestion): Venue | undefined {
    const normalizedAddress = this.normalize(result.address || result.fullAddress);
    const normalizedCity = this.normalize(result.city ?? '');

    return this.venues.find((venue) => {
      const venueAddress = this.normalize(venue.address ?? '');
      const venueCity = this.normalize(venue.city ?? '');
      if (venueAddress && normalizedAddress && venueAddress === normalizedAddress) {
        return !normalizedCity || !venueCity || venueCity === normalizedCity;
      }

      return this.normalize(venue.name) === this.normalize(result.name)
        && venueAddress === normalizedAddress;
    });
  }

  private resolveVenueIdForSave() {
    if (this.selectedVenue) {
      return of(this.selectedVenue.id);
    }

    if (this.pendingVenue) {
      const existingVenue = this.findMatchingVenue(this.pendingVenue);
      if (existingVenue) {
        return of(existingVenue.id);
      }

      const payload: Partial<Venue> = {
        name: this.pendingVenue.name,
        address: this.pendingVenue.address || this.pendingVenue.fullAddress,
        city: this.pendingVenue.city,
        latitude: this.pendingVenue.latitude,
        longitude: this.pendingVenue.longitude,
      };

      return this.venuesApi.create(payload).pipe(
        switchMap((venue) => {
          this.venues = [venue, ...this.venues];
          this.selectExistingVenue(venue);
          return of(venue.id);
        }),
      );
    }

    return of(this.toNumber(this.form.getRawValue().venueId));
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
