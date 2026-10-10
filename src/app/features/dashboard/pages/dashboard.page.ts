import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  listOutline,
  locationOutline,
  micOutline,
  musicalNotesOutline,
  peopleOutline,
  ticketOutline,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Commitment,
  Gig,
  RehearsalSession,
  Setlist,
  Song,
} from '../../../core/models/band-resources.models';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { CommitmentService } from '../../commitments/services/commitment.service';
import { GigService } from '../../gigs/services/gig.service';
import { RehearsalSessionService } from '../../rehearsal-sessions/services/rehearsal-session.service';
import { SetlistService } from '../../setlists/services/setlist.service';
import { SongService } from '../../songs/services/song.service';

type OperationalEventType = 'gig' | 'rehearsal' | 'commitment';

interface OperationalEvent {
  id: string;
  type: OperationalEventType;
  eyebrow: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  icon: string;
  link: string;
  preparation: string[];
  ready: boolean;
}

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonSpinner,
    IonTitle,
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
  private readonly rehearsals = inject(RehearsalSessionService);
  private readonly commitments = inject(CommitmentService);
  private readonly setlists = inject(SetlistService);

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly band = signal<Band | null>(null);
  readonly bandName = signal('La tua band');
  readonly upcoming = signal<OperationalEvent[]>([]);
  readonly repertoireTotal = signal(0);
  readonly readySongs = signal(0);

  readonly nextEvent = computed(() => this.upcoming()[0] ?? null);
  readonly laterEvents = computed(() => this.upcoming().slice(1));
  readonly pendingPreparationCount = computed(() =>
    this.upcoming().reduce((total, event) => total + event.preparation.length, 0),
  );
  readonly canInviteToSoloBand = computed(() => {
    const band = this.band();
    return band?.currentUserRole === 'ADMIN'
      && (band.membersCount ?? band.members?.length) === 1
      && Boolean(band.joinCode?.trim());
  });

  readonly libraryActions = [
    { icon: 'musical-notes-outline', label: 'Repertorio', route: ['repertorio'] },
    { icon: 'list-outline', label: 'Scalette', route: ['scalette'] },
    { icon: 'mic-outline', label: 'Prove', route: ['prove'] },
    { icon: 'ticket-outline', label: 'Concerti', route: ['concerti'] },
  ];

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      chevronForwardOutline,
      clipboardOutline,
      listOutline,
      locationOutline,
      micOutline,
      musicalNotesOutline,
      peopleOutline,
      ticketOutline,
      timeOutline,
    });
  }

  ionViewWillEnter(): void {
    this.loadDashboard();
  }

  get userName(): string {
    return this.auth.currentUser()?.name || 'musicista';
  }

  get bandBaseUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}` : '/band';
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
      rehearsals: this.rehearsals.list().pipe(timeout(15_000), catchError(() => of([] as RehearsalSession[]))),
      commitments: this.commitments.list().pipe(timeout(15_000), catchError(() => of([] as Commitment[]))),
      setlists: this.setlists.list().pipe(timeout(15_000), catchError(() => of([] as Setlist[]))),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe(({ band, songs, gigs, rehearsals, commitments, setlists }) => {
      if (!band) this.loadError.set('Alcuni dati della band non sono disponibili.');
      this.populateDashboard(
        band,
        songs,
        gigs.filter((gig) => !gig.bandId || gig.bandId === bandId),
        rehearsals.filter((rehearsal) => !rehearsal.bandId || rehearsal.bandId === bandId),
        commitments.filter((commitment) => !commitment.bandId || commitment.bandId === bandId),
        setlists,
      );
    });
  }

  private populateDashboard(
    band: Band | null,
    songs: Song[],
    gigs: Gig[],
    rehearsals: RehearsalSession[],
    commitments: Commitment[],
    setlists: Setlist[],
  ): void {
    this.band.set(band);
    this.bandName.set(band?.name || 'La tua band');
    this.repertoireTotal.set(songs.length);
    this.readySongs.set(songs.filter((song) => song.status === 'active').length);

    const now = Date.now();
    const today = this.startOfToday();

    const events: Array<{ timestamp: number; value: OperationalEvent }> = [
      ...gigs
        .filter((gig) => this.dateValue(gig.date) >= now)
        .map((gig) => ({
          timestamp: this.dateValue(gig.date),
          value: this.toGigEvent(gig, setlists),
        })),
      ...rehearsals
        .filter((rehearsal) => rehearsal.status !== 'cancelled' && this.dateValue(rehearsal.date) >= today)
        .map((rehearsal) => ({
          timestamp: this.eventTimestamp(rehearsal.date, rehearsal.startTime),
          value: this.toRehearsalEvent(rehearsal, songs),
        })),
      ...commitments
        .filter((commitment) => commitment.status !== 'cancelled' && this.dateValue(commitment.date) >= today)
        .map((commitment) => ({
          timestamp: this.eventTimestamp(commitment.date, commitment.startTime),
          value: this.toCommitmentEvent(commitment),
        })),
    ];

    this.upcoming.set(
      events
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 8)
        .map((item) => item.value),
    );
  }

  private toGigEvent(gig: Gig, setlists: Setlist[]): OperationalEvent {
    const setlist = setlists.find((item) => item.gigId === gig.id);
    const preparation: string[] = [];

    if (!setlist) {
      preparation.push('Prepara la scaletta');
    } else {
      const songCount = this.setlistSongCount(setlist);
      if (songCount > 0) preparation.push(`Controlla la scaletta · ${songCount} brani`);
    }

    if (!gig.venue?.name) preparation.push('Aggiungi il luogo del concerto');
    if (gig.notes?.trim()) preparation.push('Rileggi le note del live');

    return {
      id: `gig:${gig.id}`,
      type: 'gig',
      eyebrow: 'Concerto',
      title: gig.title || 'Concerto',
      date: this.dateLabel(gig.date),
      time: this.timeLabel(gig.date),
      location: gig.venue?.name ?? undefined,
      icon: 'ticket-outline',
      link: `${this.bandBaseUrl}/concerti/${gig.id}`,
      preparation,
      ready: preparation.length === 0,
    };
  }

  private toRehearsalEvent(rehearsal: RehearsalSession, songs: Song[]): OperationalEvent {
    const rehearsalSongs = rehearsal.songs?.length
      ? rehearsal.songs
      : songs.filter((song) => rehearsal.songIds?.includes(song.id));
    const preparation: string[] = [];

    if (rehearsalSongs.length > 0) {
      const notReady = rehearsalSongs.filter((song) => song.status !== 'active').length;
      preparation.push(`${rehearsalSongs.length} brani da ripassare${notReady ? ` · ${notReady} non pronti` : ''}`);
    } else {
      preparation.push('Scegli i brani da provare');
    }

    if (rehearsal.notes?.trim()) preparation.push('Rileggi le note della prova');

    return {
      id: `rehearsal:${rehearsal.id}`,
      type: 'rehearsal',
      eyebrow: 'Prova',
      title: rehearsal.title || 'Prova',
      date: this.dateLabel(rehearsal.date),
      time: rehearsal.startTime?.slice(0, 5) || undefined,
      location: rehearsal.rehearsalRoom?.name ?? undefined,
      icon: 'mic-outline',
      link: `${this.bandBaseUrl}/prove/${rehearsal.id}`,
      preparation,
      ready: preparation.length === 0,
    };
  }

  private toCommitmentEvent(commitment: Commitment): OperationalEvent {
    const preparation: string[] = [];
    if (commitment.notes?.trim()) preparation.push('Rileggi le note dell’impegno');

    return {
      id: `commitment:${commitment.id}`,
      type: 'commitment',
      eyebrow: this.commitmentTypeLabel(commitment.type),
      title: commitment.title || 'Impegno',
      date: this.dateLabel(commitment.date),
      time: commitment.startTime?.slice(0, 5) || undefined,
      location: commitment.location ?? undefined,
      icon: 'calendar-outline',
      link: `${this.bandBaseUrl}/impegni/${commitment.id}/modifica`,
      preparation,
      ready: preparation.length === 0,
    };
  }

  private setlistSongCount(setlist: Setlist): number {
    if (setlist.songEntries?.length) return setlist.songEntries.length;
    if (setlist.songs?.length) return setlist.songs.length;
    if (setlist.songIds?.length) return setlist.songIds.length;
    if (setlist.items?.length) {
      return setlist.items.reduce(
        (total, section) => total + section.items.filter((item) => item.type === 'song').length,
        0,
      );
    }
    return 0;
  }

  private commitmentTypeLabel(type: Commitment['type']): string {
    const labels: Record<Commitment['type'], string> = {
      photo_shoot: 'Servizio fotografico',
      recording: 'Registrazione',
      interview: 'Intervista',
      meeting: 'Riunione',
      travel: 'Trasferta',
      promo: 'Promozione',
      other: 'Impegno',
    };
    return labels[type];
  }

  private dateLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (this.isSameDay(date, today)) return 'Oggi';
    if (this.isSameDay(date, tomorrow)) return 'Domani';

    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  private timeLabel(value: string): string | undefined {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return undefined;
    if (date.getHours() === 0 && date.getMinutes() === 0) return undefined;
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  private eventTimestamp(dateValue: string, timeValue?: string | null): number {
    if (!timeValue) return this.dateValue(dateValue);
    const date = new Date(dateValue);
    const [hours, minutes] = timeValue.split(':').map(Number);
    if (!Number.isFinite(date.getTime())) return 0;
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date.getTime();
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private startOfToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

  private dateValue(value: string | undefined): number {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
}
