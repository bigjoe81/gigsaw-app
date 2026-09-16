import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  checkmarkCircle,
  documentTextOutline,
  homeOutline,
  listOutline,
  locationOutline,
  micOutline,
  musicalNotesOutline,
  notificationsOutline,
  searchOutline,
  ticketOutline,
} from 'ionicons/icons';
import { BandContextService } from '../../../core/services/band-context.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Gig, Song } from '../../../core/models/band-resources.models';
import { Band } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { GigService } from '../../gigs/services/gig.service';
import { SongService } from '../../songs/services/song.service';

interface DashboardEvent {
  id: number;
  badgeTop: string;
  badgeMain: string;
  badgeBottom: string;
  title: string;
  meta: string;
  location?: string;
  tone: 'blue' | 'green' | 'amber';
  action: string;
  link: string;
}

interface DashboardCard {
  icon: string;
  label: string;
  value: string;
  note: string;
  noteTone: 'success' | 'default';
  progress?: number;
}

interface DashboardActivity {
  id: number;
  text: string;
  target: string;
  time: string;
  avatar: string;
}

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonToolbar,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  private readonly bandContext = inject(BandContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly bands = inject(BandService);
  private readonly songs = inject(SongService);
  private readonly gigs = inject(GigService);

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly cards = signal<DashboardCard[]>([]);
  readonly events = signal<DashboardEvent[]>([]);
  readonly activities = signal<DashboardActivity[]>([]);

  readonly quickActions = [
    { icon: 'musical-notes-outline', label: 'Aggiungi brano', route: ['repertorio', 'new'] },
    { icon: 'list-outline', label: 'Crea scaletta', route: ['scalette', 'new'] },
    { icon: 'mic-outline', label: 'Registra prova', route: ['prove', 'new'] },
    { icon: 'ticket-outline', label: 'Nuovo concerto', route: ['concerti', 'new'] },
  ];

  readonly repertoire = signal([
    { label: 'Pronti', value: 0, color: 'blue' },
    { label: 'Da provare', value: 0, color: 'green' },
    { label: 'In lavorazione', value: 0, color: 'amber' },
  ]);
  readonly repertoireTotal = signal(0);

  get repertoireChartBackground(): string {
    const total = this.repertoireTotal();
    if (!total) return 'conic-gradient(#e6ebf2 0 100%)';
    const values = this.repertoire();
    const readyEnd = (values[0].value / total) * 100;
    const rehearsalEnd = readyEnd + (values[1].value / total) * 100;
    return `conic-gradient(var(--p) 0 ${readyEnd}%, var(--g) ${readyEnd}% ${rehearsalEnd}%, var(--a) ${rehearsalEnd}% 100%)`;
  }

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      checkmarkCircle,
      documentTextOutline,
      homeOutline,
      listOutline,
      locationOutline,
      micOutline,
      musicalNotesOutline,
      notificationsOutline,
      searchOutline,
      ticketOutline,
    });
    this.loadDashboard();
  }

  get userName(): string {
    return this.auth.currentUser()?.name || 'musicista';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toLocaleUpperCase('it');
  }

  get bandBaseUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}` : '/bands';
  }

  private loadDashboard(): void {
    const bandId = Number(this.route.snapshot.paramMap.get('bandId')) || this.bandContext.getCurrentBand();
    if (!bandId) {
      this.loadError.set('Nessuna band attiva selezionata.');
      this.loading.set(false);
      return;
    }

    this.bandContext.setCurrentBand(bandId);
    this.loading.set(true);
    this.loadError.set('');

    forkJoin({
      band: this.bands.get(bandId).pipe(timeout(15_000), catchError(() => of(null))),
      songs: this.songs.list().pipe(timeout(15_000), catchError(() => of([] as Song[]))),
      gigs: this.gigs.list().pipe(timeout(15_000), catchError(() => of([] as Gig[]))),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe(({ band, songs, gigs }) => {
      if (!band) this.loadError.set('Alcuni dati della dashboard non sono disponibili.');
      this.populateDashboard(band, songs, gigs.filter((gig) => gig.bandId === bandId));
    });
  }

  private populateDashboard(band: Band | null, songs: Song[], gigs: Gig[]): void {
    const now = Date.now();
    const upcomingGigs = gigs
      .filter((gig) => this.dateValue(gig.date) >= now)
      .sort((a, b) => this.dateValue(a.date) - this.dateValue(b.date));
    const nextGig = upcomingGigs[0];
    const pressKitProgress = this.pressKitProgress(band);
    const songsThisMonth = songs.filter((song) => this.isCurrentMonth(song.createdAt)).length;

    this.cards.set([
      {
        icon: 'musical-notes-outline', label: 'Brani in repertorio', value: String(songs.length),
        note: songsThisMonth ? `+${songsThisMonth} questo mese` : '', noteTone: 'success',
      },
      {
        icon: 'calendar-outline', label: 'Prossima prova', value: '—',
        note: 'Nessuna prova pianificata', noteTone: 'default',
      },
      {
        icon: 'ticket-outline', label: 'Prossimo concerto',
        value: nextGig ? this.shortDate(nextGig.date) : '—',
        note: nextGig?.venue?.name ?? (nextGig ? nextGig.title : 'Nessun concerto pianificato'), noteTone: 'default',
      },
      {
        icon: 'document-text-outline', label: 'Press kit', value: `${pressKitProgress}%`,
        note: '', noteTone: 'default', progress: pressKitProgress,
      },
    ]);

    this.events.set(upcomingGigs.slice(0, 3).map((gig) => this.toDashboardEvent(gig)));
    this.activities.set(songs
      .filter((song) => Boolean(song.updatedAt))
      .sort((a, b) => this.dateValue(b.updatedAt) - this.dateValue(a.updatedAt))
      .slice(0, 3)
      .map((song) => ({
        id: song.id, text: 'Brano aggiornato', target: song.title,
        time: this.dateTime(song.updatedAt), avatar: this.userInitial,
      })));

    const ready = songs.filter((song) => song.status?.toLocaleLowerCase() === 'active').length;
    const archived = songs.filter((song) => song.status?.toLocaleLowerCase() === 'archived').length;
    this.repertoire.set([
      { label: 'Pronti', value: ready, color: 'blue' },
      { label: 'Da provare', value: archived, color: 'green' },
      { label: 'In lavorazione', value: Math.max(0, songs.length - ready - archived), color: 'amber' },
    ]);
    this.repertoireTotal.set(songs.length);
  }

  private toDashboardEvent(gig: Gig): DashboardEvent {
    const date = new Date(gig.date);
    return {
      id: gig.id,
      badgeTop: date.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '').toUpperCase(),
      badgeMain: date.toLocaleDateString('it-IT', { day: '2-digit' }),
      badgeBottom: date.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase(),
      title: gig.title || 'Concerto',
      meta: this.dateTime(gig.date).toUpperCase(),
      location: gig.venue?.name ?? undefined,
      tone: 'green', action: 'Dettagli', link: `${this.bandBaseUrl}/concerti/${gig.id}`,
    };
  }

  private pressKitProgress(band: Band | null): number {
    if (!band) return 0;
    const fields = [band.logo, band.bioShort, band.bio, band.city, band.email, band.phone, band.website, band.genres?.length];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  private shortDate(value: string | undefined): string {
    return value ? new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—';
  }

  private dateTime(value: string | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private dateValue(value: string | undefined): number {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private isCurrentMonth(value: string | undefined): boolean {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
}
