import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, businessOutline, locationOutline, pencilOutline, trashOutline } from 'ionicons/icons';
import { finalize, forkJoin } from 'rxjs';
import { RehearsalRoom, Venue } from '../../../core/models/band-resources.models';
import { RehearsalRoomService } from '../../rehearsal-sessions/services/rehearsal-room.service';
import {
  DaisyButtonComponent,
  DaisyInputComponent,
  DaisyLoadingComponent,
  DaisyMessageComponent,
} from '../../../shared/ui/daisyui';
import { VenueService } from '../services/venue.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DaisyButtonComponent,
    DaisyInputComponent,
    DaisyLoadingComponent,
    DaisyMessageComponent,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './venue-list.page.html',
  styleUrl: './venue-list.page.scss',
})
export class VenueListPage implements OnInit {
  readonly venues = signal<Venue[]>([]);
  readonly rehearsalRooms = signal<RehearsalRoom[]>([]);
  readonly query = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly deletingKey = signal<string | null>(null);
  readonly visibleLocations = computed(() => {
    const query = this.normalize(this.query());
    const locations = [
      ...this.venues().map((location) => ({ kind: 'venue' as const, location })),
      ...this.rehearsalRooms().map((location) => ({ kind: 'room' as const, location })),
    ].sort((a, b) => a.location.name.localeCompare(b.location.name, 'it'));
    if (!query) return locations;
    return locations.filter(({ location }) => this.normalize([location.name, location.address, location.city].filter(Boolean).join(' ')).includes(query));
  });
  readonly cityCount = computed(() => new Set(
    [...this.venues(), ...this.rehearsalRooms()].map((location) => this.normalize(location.city ?? '')).filter(Boolean),
  ).size);
  readonly locationCount = computed(() => this.venues().length + this.rehearsalRooms().length);

  constructor(
    private readonly venuesApi: VenueService,
    private readonly rehearsalRoomsApi: RehearsalRoomService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
  ) {
    addIcons({ add, businessOutline, locationOutline, pencilOutline, trashOutline });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ venues: this.venuesApi.list(), rooms: this.rehearsalRoomsApi.list() }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ venues, rooms }) => {
        this.venues.set(venues);
        this.rehearsalRooms.set(rooms);
      },
      error: (error: Error) => this.error.set(error.message || 'Impossibile caricare i luoghi.'),
    });
  }

  async confirmDelete(kind: 'venue' | 'room', location: Venue | RehearsalRoom): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare il luogo?',
      message: `${location.name} verrà rimosso dall’anagrafica.`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete(kind, location) },
      ],
    });
    await dialog.present();
  }

  address(location: Venue | RehearsalRoom): string {
    return [location.address, location.city].filter(Boolean).join(' · ') || 'Indirizzo non specificato';
  }

  private delete(kind: 'venue' | 'room', location: Venue | RehearsalRoom): void {
    this.deletingKey.set(`${kind}-${location.id}`);
    const request = kind === 'venue' ? this.venuesApi.delete(location.id) : this.rehearsalRoomsApi.delete(location.id);
    request.pipe(
      finalize(() => this.deletingKey.set(null)),
    ).subscribe({
      next: async () => {
        if (kind === 'venue') this.venues.update((items) => items.filter((item) => item.id !== location.id));
        else this.rehearsalRooms.update((items) => items.filter((item) => item.id !== location.id));
        (await this.toast.create({ message: 'Luogo eliminato.', duration: 1800, color: 'success' })).present();
      },
      error: async () => {
        (await this.toast.create({ message: 'Impossibile eliminare il luogo.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
