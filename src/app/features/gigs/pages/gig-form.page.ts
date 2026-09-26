import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
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
import {
  DaisyButtonComponent,
  DaisyDatepickerComponent,
  DaisyInputComponent,
  DaisyLoadingComponent,
  DaisyMessageComponent,
  DaisyTextareaComponent,
  DaisyTimeInputComponent,
  DaisyTypeaheadComponent,
  DaisyTypeaheadItem,
} from '../../../shared/ui/daisyui';
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
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    DaisyButtonComponent,
    DaisyDatepickerComponent,
    DaisyInputComponent,
    DaisyLoadingComponent,
    DaisyMessageComponent,
    DaisyTextareaComponent,
    DaisyTimeInputComponent,
    DaisyTypeaheadComponent,
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

  readonly editing = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly searchingMapbox = signal(false);
  readonly error = signal('');
  readonly venueQuery = signal('');
  readonly venues = signal<Venue[]>([]);
  readonly filteredVenues = signal<Venue[]>([]);
  readonly mapboxResults = signal<MapboxAddressSuggestion[]>([]);
  readonly selectedVenue = signal<Venue | undefined>(undefined);
  readonly pendingVenue = signal<MapboxAddressSuggestion | undefined>(undefined);
  readonly venueTypeaheadItems = computed<DaisyTypeaheadItem[]>(() => [
    ...this.filteredVenues().map((venue) => ({
      id: `venue:${venue.id}`,
      label: venue.name,
      description: this.venueMeta(venue),
      data: venue,
    })),
    ...this.mapboxResults().map((result) => ({
      id: `mapbox:${result.id}`,
      label: result.name,
      description: result.fullAddress,
      data: result,
    })),
  ]);
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
    this.editing.set(!!this.id);
    this.bindVenueSearch();

    forkJoin({
      venues: this.venuesApi.list(),
      gig: this.id ? this.gigs.get(this.id) : of(undefined),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ venues, gig }) => {
        this.venues.set(venues);
        this.filteredVenues.set(venues.slice(0, 8));
        if (gig) this.patchGig(gig);
      },
      error: (error: unknown) => {
        this.error.set(this.apiErrorMessage(error, this.id ? 'Impossibile caricare il concerto.' : 'Impossibile caricare le venue.'));
      },
    });
  }

  save(): void {
    this.error.set('');
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.error.set('Completa i campi obbligatori prima di salvare.');
      return;
    }
    if (!this.selectedVenue() && !this.pendingVenue()) {
      this.error.set('Seleziona una venue dai risultati prima di salvare.');
      return;
    }

    this.saving.set(true);
    this.resolveVenueIdForSave().pipe(
      switchMap((venueId) => {
        const values = this.form.getRawValue();
        const payload: Partial<Gig> = {
          title: values.title.trim(),
          date: this.combineDateAndTime(values.date, values.time),
          venueId,
          notes: values.notes.trim() || null,
        };
        return this.editing() ? this.gigs.update(this.id!, payload) : this.gigs.create(payload);
      }),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto salvato.', duration: 1800, color: 'success' })).present();
        void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/concerti` : '/band');
      },
      error: (error: unknown) => {
        this.error.set(this.apiErrorMessage(error, 'Salvataggio non riuscito.'));
      },
    });
  }

  onVenueQueryInput(value: string): void {
    this.venueQuery.set(value);
    this.selectedVenue.set(undefined);
    this.pendingVenue.set(undefined);
    this.form.patchValue({ venueId: '' }, { emitEvent: false });
    this.venueQueryChanges.next(value);
  }

  onVenueTypeaheadSelected(item: DaisyTypeaheadItem): void {
    if (String(item.id).startsWith('venue:')) {
      this.selectExistingVenue(item.data as Venue);
      return;
    }
    this.selectMapboxResult(item.data as MapboxAddressSuggestion);
  }

  selectExistingVenue(venue: Venue): void {
    this.selectedVenue.set(venue);
    this.pendingVenue.set(undefined);
    this.venueQuery.set(this.venueLabel(venue));
    this.filteredVenues.set([]);
    this.mapboxResults.set([]);
    this.form.patchValue({ venueId: String(venue.id) }, { emitEvent: false });
  }

  selectMapboxResult(result: MapboxAddressSuggestion): void {
    const existingVenue = this.findMatchingVenue(result);
    if (existingVenue) {
      this.selectExistingVenue(existingVenue);
      return;
    }
    this.selectedVenue.set(undefined);
    this.pendingVenue.set(result);
    this.venueQuery.set(result.fullAddress);
    this.filteredVenues.set([]);
    this.mapboxResults.set([]);
    this.form.patchValue({ venueId: '' }, { emitEvent: false });
  }

  clearVenueSelection(): void {
    this.selectedVenue.set(undefined);
    this.pendingVenue.set(undefined);
    this.venueQuery.set('');
    this.filteredVenues.set(this.venues().slice(0, 8));
    this.mapboxResults.set([]);
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
    const venue = gig.venue ?? this.venues().find((item) => item.id === gig.venueId);
    if (venue) this.selectExistingVenue(venue);
  }

  private bindVenueSearch(): void {
    this.venueQueryChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((query) => {
        const trimmed = query.trim();
        this.filteredVenues.set(this.filterVenues(trimmed));
        if (!this.mapbox.isConfigured() || trimmed.length < 3) {
          this.searchingMapbox.set(false);
          return of([] as MapboxAddressSuggestion[]);
        }
        this.searchingMapbox.set(true);
        return this.mapbox.search(trimmed).pipe(
          catchError(() => of([] as MapboxAddressSuggestion[])),
          finalize(() => this.searchingMapbox.set(false)),
        );
      }),
    ).subscribe((results) => {
      this.mapboxResults.set(results.filter((result) => !this.findMatchingVenue(result)));
    });
  }

  private filterVenues(query: string): Venue[] {
    if (!query) return this.venues().slice(0, 8);
    const normalizedQuery = this.normalize(query);
    return this.venues().filter((venue) => this.normalize(this.venueLabel(venue)).includes(normalizedQuery)).slice(0, 8);
  }

  private findMatchingVenue(result: MapboxAddressSuggestion): Venue | undefined {
    const normalizedAddress = this.normalize(result.address || result.fullAddress);
    const normalizedCity = this.normalize(result.city ?? '');
    return this.venues().find((venue) => {
      const venueAddress = this.normalize(venue.address ?? '');
      const venueCity = this.normalize(venue.city ?? '');
      if (venueAddress && normalizedAddress && venueAddress === normalizedAddress) {
        return !normalizedCity || !venueCity || venueCity === normalizedCity;
      }
      return this.normalize(venue.name) === this.normalize(result.name) && venueAddress === normalizedAddress;
    });
  }

  private resolveVenueIdForSave(): Observable<number> {
    const selectedVenue = this.selectedVenue();
    const pendingVenue = this.pendingVenue();
    if (selectedVenue) return of(selectedVenue.id);
    if (!pendingVenue) return throwError(() => new Error('Seleziona una venue.'));

    const existingVenue = this.findMatchingVenue(pendingVenue);
    if (existingVenue) return of(existingVenue.id);

    const payload: Partial<Venue> = {
      name: pendingVenue.name,
      address: pendingVenue.address || pendingVenue.fullAddress,
      city: pendingVenue.city,
      latitude: pendingVenue.latitude,
      longitude: pendingVenue.longitude,
    };
    return this.venuesApi.create(payload).pipe(
      switchMap((venue) => {
        this.venues.update((venues) => [venue, ...venues]);
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
