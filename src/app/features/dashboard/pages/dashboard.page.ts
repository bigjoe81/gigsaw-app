import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

interface DashboardEvent {
  badgeTop: string;
  badgeMain: string;
  badgeBottom: string;
  title: string;
  meta: string;
  location?: string;
  tone: 'blue' | 'green' | 'amber';
  action: string;
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

  readonly cards = [
    {
      icon: 'musical-notes-outline',
      label: 'Brani in repertorio',
      value: '42',
      note: '+3 questo mese',
      noteTone: 'success',
    },
    {
      icon: 'calendar-outline',
      label: 'Prossima prova',
      value: 'Giov 6 ago',
      note: '21:00',
      noteTone: 'default',
    },
    {
      icon: 'ticket-outline',
      label: 'Prossimo concerto',
      value: '31 ott',
      note: 'Nama Brewing',
      noteTone: 'default',
    },
    {
      icon: 'document-text-outline',
      label: 'Press kit',
      value: '82%',
      note: '',
      noteTone: 'default',
      progress: 82,
    },
  ];

  readonly events: DashboardEvent[] = [
    {
      badgeTop: 'GIO',
      badgeMain: '06',
      badgeBottom: 'AGO',
      title: 'Prova generale',
      meta: 'GIO 06 AGO, 21:00',
      location: 'Sala 2 · Music Factory',
      tone: 'blue',
      action: 'Dettagli',
    },
    {
      badgeTop: 'SAB',
      badgeMain: '31',
      badgeBottom: 'OTT',
      title: 'Halloween Live',
      meta: 'SAB 31 OTT, 21:00',
      location: 'Nama Brewing',
      tone: 'green',
      action: 'Dettagli',
    },
    {
      badgeTop: 'LUN',
      badgeMain: '10',
      badgeBottom: 'AGO',
      title: 'Aggiorna tech kit',
      meta: 'LUN 10 AGO',
      tone: 'amber',
      action: 'Apri',
    },
  ];

  readonly activities = [
    { actor: 'Irina', text: 'ha aggiornato', target: 'Sweet Home Chicago', time: 'Oggi, 15:24', avatar: 'I' },
    { actor: 'Roberto', text: 'ha caricato una nuova versione audio', target: '', time: 'Oggi, 11:08', avatar: 'R' },
    { actor: '', text: 'Hai completato la scaletta', target: 'Halloween Live', time: 'Ieri, 22:17', avatar: 'check' },
  ];

  readonly quickActions = [
    { icon: 'musical-notes-outline', label: 'Aggiungi brano', link: 'repertorio/new' },
    { icon: 'list-outline', label: 'Crea scaletta', link: 'scalette/new' },
    { icon: 'mic-outline', label: 'Registra prova', link: 'prove/new' },
    { icon: 'ticket-outline', label: 'Nuovo concerto', link: 'concerti/new' },
  ];

  readonly repertoire = [
    { label: 'Pronti', value: 31, color: 'blue' },
    { label: 'Da provare', value: 8, color: 'green' },
    { label: 'In lavorazione', value: 3, color: 'amber' },
  ];

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
  }

  get bandBaseUrl(): string {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}` : '/bands';
  }
}
