import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, locationOutline } from 'ionicons/icons';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  throwError,
} from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { Venue } from '../../venues/models/venue.models';
import { MapboxAddressSuggestion, MapboxGeocodingService } from '../../venues/services/mapbox-geocoding.service';
import { VenueService } from '../../venues/services/venue.service';
import { GigService } from '../services/gig.service';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonNote,
    IonSearchbar,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './gig-form.page.html',
  styleUrl: './gig-form.page.scss',
})
export class GigFormPage implements OnInit {
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    date: ['', Validators.required],
    time: '',
    venueId: '',
    notes: '',
  });

  editing = false;
  loading = true;
  saving = false;
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
  ) {
    addIcons({ calendarOutline, locationOutline });
  }

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
        this.filteredVenues = venues.slice(0, 8);
        if (gig) this.patchGig(gig);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = this.apiErrorMessage(error, this.id ? 'Impossibile caricare il concerto.' : 'Impossibile caricare le venue.');
        this.loading = false;
      },
    });
  }

  save(): void {
    this.error = '';
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.error = 'Completa i campi obbligatori prima di salvare.';
      return;
    }
    if (!this.selectedVenue && !this.pendingVenue) {
      this.error = 'Seleziona una venue dai risultati prima di salvare.';
      return;
    }

    this.saving = true;
    this.resolveVenueIdForSave().pipe(
      switchMap((venueId) => {
        const values = this.form.getRawValue();
        const payload: Partial<Gig> = {
          title: values.title.trim(),
          date: this.combineDateAndTime(values.date, values.time),
          venueId,
          notes: values.notes.trim() || null,
        };
        return this.editing ? this.gigs.update(this.id!, payload) : this.gigs.create(payload);
      }),
      finalize(() => { this.saving = false; }),
    ).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto salvato.', duration: 1800, color: 'success' })).present();
        void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/concerti` : '/bands');
      },
      error: (error: unknown) => {
        this.error = this.apiErrorMessage(error, 'Salvataggio non riuscito.');
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
    this.filteredVenues = this.venues.slice(0, 8);
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

  private patchGig(gig: Gig): void {
    this.form.patchValue({
      title: gig.title,
      date: this.normalizeDate(gig.date),
      time: this.extractTime(gig.date),
      venueId: gig.venueId != null ? String(gig.venueId) : '',
      notes: gig.notes ?? '',
    });
    const venue = gig.venue ?? this.venues.find((item) => item.id === gig.venueId);
    if (venue) this.selectExistingVenue(venue);
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
        return this.mapbox.search(trimmed).pipe(
          catchError(() => of([] as MapboxAddressSuggestion[])),
          finalize(() => { this.searchingMapbox = false; }),
        );
      }),
    ).subscribe((results) => {
      this.mapboxResults = results.filter((result) => !this.findMatchingVenue(result));
    });
  }

  private filterVenues(query: string): Venue[] {
    if (!query) return this.venues.slice(0, 8);
    const normalizedQuery = this.normalize(query);
    return this.venues.filter((venue) => this.normalize(this.venueLabel(venue)).includes(normalizedQuery)).slice(0, 8);
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
      return this.normalize(venue.name) === this.normalize(result.name) && venueAddress === normalizedAddress;
    });
  }

  private resolveVenueIdForSave(): Observable<number> {
    if (this.selectedVenue) return of(this.selectedVenue.id);
    if (!this.pendingVenue) return throwError(() => new Error('Seleziona una venue.'));

    const existingVenue = this.findMatchingVenue(this.pendingVenue);
    if (existingVenue) return of(existingVenue.id);

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

  private combineDateAndTime(date: string, time: string): string {
    const normalizedDate = this.normalizeDate(date);
    return time ? `${normalizedDate}T${time}:00` : normalizedDate;
  }

  private normalizeDate(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) return this.normalizeDate(value[0]);
    return value ? String(value).slice(0, 10) : '';
  }

  private extractTime(value: string): string {
    return value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? '';
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const validationErrors = error.error?.errors as Record<string, string[]> | undefined;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).find((messages) => messages.length)?.[0]
        : undefined;
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
