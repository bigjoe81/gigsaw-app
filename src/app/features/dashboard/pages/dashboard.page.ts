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
  documentTextOutline,
  listOutline,
  locationOutline,
  micOutline,
  musicalNotesOutline,
  peopleOutline,
  ticketOutline,
} from 'ionicons/icons';
import { BandContextService } from '../../../core/services/band-context.service';
import { AuthService } from '../../../core/auth/auth.service';
import { BandFlow, BandFlowService } from '../../../core/services/band-flow.service';
import { Gig, RehearsalSession, Song } from '../../../core/models/band-resources.models';
import { Band } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { GigService } from '../../gigs/services/gig.service';
import { SongService } from '../../songs/services/song.service';
import { RehearsalSessionService } from '../../rehearsal-sessions/services/rehearsal-session.service';

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

interface DashboardActivity {
  id: string;
  text: string;
  target: string;
  time: string;
  icon: string;
  link: string;
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
  private readonly bandFlow = inject(BandFlowService);

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly bandName = signal('La tua band');
  readonly pressKitProgress = signal(0);
  readonly events = signal<DashboardEvent[]>([]);
  readonly activities = signal<DashboardActivity[]>([]);
  readonly band = signal<Band | null>(null);
  readonly flow = signal<BandFlow | null>(null);
  readonly canInviteToSoloBand = computed(() => {
    const band = this.band();
    return band?.currentUserRole === 'ADMIN'
      && (band.membersCount ?? band.members?.length) === 1
      && Boolean(band.joinCode?.trim());
  });
  readonly flowGuide = computed(() => {
    if (this.flow() === 'building') {
      return {
        eyebrow: 'Costruzione repertorio',
        title: 'Partite dai brani, non dal calendario.',
        text: 'Aggiungete i pezzi che volete preparare e portateli progressivamente a uno stato suonabile. Prove e scalette arriveranno come conseguenza del repertorio.',
        cta: this.repertoireTotal() ? 'Continua il repertorio' : 'Aggiungi il primo brano',
        route: this.repertoireTotal() ? [this.bandBaseUrl, 'repertorio'] : [this.bandBaseUrl, 'repertorio', 'nuovo'],
      };
    }
    if (this.flow() === 'importing') {
      return {
        eyebrow: 'Repertorio esistente',
        title: 'Prima portiamo dentro quello che sapete già suonare.',
        text: 'Organizza il repertorio esistente, completa i dati mancanti e poi usa prove e scalette senza ricostruire la band da zero.',
        cta: 'Apri il repertorio',
        route: [this.bandBaseUrl, 'repertorio'],
      };
    }
    if (this.flow() === 'active') {
      return {
        eyebrow: 'Band attiva',
        title: 'Concentrati su quello che state preparando adesso.',
        text: 'Prossime prove, live e scalette vengono prima; il repertorio resta la base comune che collega tutto il lavoro della band.',
        cta: this.events().length ? 'Vedi i prossimi impegni' : 'Aggiungi il prossimo impegno',
        route: this.events().length ? [this.bandBaseUrl, 'impegni'] : [this.bandBaseUrl, 'prove', 'nuova'],
      };
    }
    return null;
  });
  readonly quickActions = [
    { icon: 'musical-notes-outline', label: 'Aggiungi brano', route: ['repertorio', 'nuovo'] },
    { icon: 'list-outline', label: 'Crea scaletta', route: ['scalette', 'nuova'] },
    { icon: 'mic-outline', label: 'Registra prova', route: ['prove', 'nuova'] },
    { icon: 'ticket-outline', label: 'Nuovo concerto', route: ['concerti', 'nuovo'] },
  ];

  readonly repertoire = signal([
    { label: 'Pronti', value: 0, color: 'blue' },
    { label: 'Da provare', value: 0, color: 'green' },
    { label: 'In lavorazione', value: 0, color: 'amber' },
  ]);
  readonly repertoireTotal = signal(0);

  get repertoireChartBackground(): string {
    const total = this.repertoireTotal();
    if (!total) return 'conic-gradient(var(--gigsaw-border) 0 100%)';
    const values = this.repertoire();
    const readyEnd = (values[0].value / total) * 100;
    const rehearsalEnd = readyEnd + (values[1].value / total) * 100;
    return `conic-gradient(var(--ion-color-secondary) 0 ${readyEnd}%, var(--ion-color-success) ${readyEnd}% ${rehearsalEnd}%, var(--ion-color-warning) ${rehearsalEnd}% 100%)`;
  }

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      chevronForwardOutline,
      documentTextOutline,
      listOutline,
      locationOutline,
      micOutline,
      musicalNotesOutline,
      peopleOutline,
      ticketOutline,
    });
  }

  ionViewWillEnter(): void { this.loadDashboard(); }

  get userName(): string {
    return this.auth.currentUser()?.name || 'musicista';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toLocaleUpperCase('it');
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
    this.flow.set(this.bandFlow.get(bandId));
    this.loading.set(true);
    this.loadError.set('');

    forkJoin({
      band: this.bands.get(bandId).pipe(timeout(15_000), catchError(() => of(null))),
      songs: this.songs.list().pipe(timeout(15_000), catchError(() => of([] as Song[]))),
      gigs: this.gigs.list().pipe(timeout(15_000), catchError(() => of([] as Gig[]))),
      rehearsals: this.rehearsals.list().pipe(timeout(15_000), catchError(() => of([] as RehearsalSession[]))),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe(({ band, songs, gigs, rehearsals }) => {
      if (!band) this.loadError.set('Alcuni dati della dashboard non sono disponibili.');
      this.populateDashboard(
        band,
        songs,
        gigs.filter((gig) => !gig.bandId || gig.bandId === bandId),
        rehearsals.filter((rehearsal) => !rehearsal.bandId || rehearsal.bandId === bandId),
      );
    });
  }

  private populateDashboard(band: Band | null, songs: Song[], gigs: Gig[], rehearsals: RehearsalSession[]): void {
    this.band.set(band);
    const now = Date.now();
    const upcomingGigs = gigs
      .filter((gig) => this.dateValue(gig.date) >= now)
      .sort((a, b) => this.dateValue(a.date) - this.dateValue(b.date));
    const upcomingRehearsals = rehearsals
      .filter((rehearsal) => rehearsal.status !== 'cancelled' && this.dateValue(rehearsal.date) >= this.startOfToday())
      .sort((a, b) => this.dateValue(a.date) - this.dateValue(b.date));

    this.bandName.set(band?.name || 'La tua band');
    this.pressKitProgress.set(this.calculatePressKitProgress(band));

    const agenda = [
      ...upcomingGigs.map((gig) => ({ date: this.dateValue(gig.date), event: this.toDashboardEvent(gig) })),
      ...upcomingRehearsals.map((rehearsal) => ({ date: this.dateValue(rehearsal.date), event: this.toRehearsalEvent(rehearsal) })),
    ].sort((a, b) => a.date - b.date).slice(0, 4);
    this.events.set(agenda.map((item) => item.event));

    const recent = [
      ...songs.map(song => ({ id: `song:${song.id}`, target: song.title, kind: 'Brano', icon: 'musical-notes-outline', link: `${this.bandBaseUrl}/repertorio/${song.id}`, updatedAt: song.updatedAt, createdAt: song.createdAt })),
      ...gigs.map(gig => ({ id: `gig:${gig.id}`, target: gig.title || 'Concerto', kind: 'Concerto', icon: 'ticket-outline', link: `${this.bandBaseUrl}/concerti/${gig.id}`, updatedAt: gig.updatedAt, createdAt: gig.createdAt })),
      ...rehearsals.map(rehearsal => ({ id: `rehearsal:${rehearsal.id}`, target: rehearsal.title || 'Prova', kind: 'Prova', icon: 'mic-outline', link: `${this.bandBaseUrl}/prove/${rehearsal.id}`, updatedAt: rehearsal.updatedAt, createdAt: rehearsal.createdAt })),
    ].filter(item => this.dateValue(item.updatedAt || item.createdAt) > 0)
      .sort((a, b) => this.dateValue(b.updatedAt || b.createdAt) - this.dateValue(a.updatedAt || a.createdAt))
      .slice(0, 5);
    this.activities.set(recent.map(item => ({
      id: item.id, target: item.target, icon: item.icon, link: item.link,
      text: `${item.kind} ${item.updatedAt && item.updatedAt !== item.createdAt ? (item.kind === 'Prova' ? 'aggiornata' : 'aggiornato') : (item.kind === 'Prova' ? 'aggiunta' : 'aggiunto')}`,
      time: this.dateTime(item.updatedAt || item.createdAt),
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

  private toRehearsalEvent(rehearsal: RehearsalSession): DashboardEvent {
    const date = new Date(rehearsal.date);
    return {
      id: -rehearsal.id,
      badgeTop: date.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '').toUpperCase(),
      badgeMain: date.toLocaleDateString('it-IT', { day: '2-digit' }),
      badgeBottom: date.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase(),
      title: rehearsal.title || 'Prova',
      meta: ['PROVA', rehearsal.startTime?.slice(0, 5)].filter(Boolean).join(' · '),
      location: rehearsal.rehearsalRoom?.name ?? undefined,
      tone: 'blue',
      action: 'Dettagli',
      link: `${this.bandBaseUrl}/prove/${rehearsal.id}`,
    };
  }

  private calculatePressKitProgress(band: Band | null): number {
    if (!band) return 0;
    const fields = [band.logo, band.bioShort, band.bio, band.city, band.email, band.phone, band.website, band.genres?.length];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  private dateTime(value: string | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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

  private isCurrentMonth(value: string | undefined): boolean {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
}
