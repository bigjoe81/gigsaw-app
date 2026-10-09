import { Component, EnvironmentInjector, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  isPlatform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  homeOutline,
  listOutline,
  musicalNotesOutline,
  peopleOutline,
} from 'ionicons/icons';
import { BandContextService } from '../core/services/band-context.service';
import { Band } from '../features/bands/models/band.models';
import { BandService } from '../features/bands/services/band.service';

type FlowSection = 'home' | 'musica' | 'agenda' | 'live' | 'band';

@Component({
  selector: 'app-band-layout',
  templateUrl: './band-layout.page.html',
  styleUrls: ['./band-layout.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet,
  ],
})
export class BandLayoutPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);
  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');
  readonly currentBand = signal<Band | null>(null);
  readonly currentBandLoading = signal(true);

  readonly sections: Array<{ key: FlowSection; label: string; icon: string; hint: string }> = [
    { key: 'home', label: 'Home', icon: 'home-outline', hint: 'Cosa viene dopo' },
    { key: 'musica', label: 'Musica', icon: 'musical-notes-outline', hint: 'Brani e repertorio' },
    { key: 'agenda', label: 'Agenda', icon: 'calendar-outline', hint: 'Prove, live e impegni' },
    { key: 'live', label: 'Live', icon: 'list-outline', hint: 'Scalette e palco' },
    { key: 'band', label: 'Band', icon: 'people-outline', hint: 'Persone e profilo' },
  ];

  constructor() {
    addIcons({ arrowBackOutline, calendarOutline, homeOutline, listOutline, musicalNotesOutline, peopleOutline });
  }

  ngOnInit(): void {
    const bandId = Number(this.route.snapshot.paramMap.get('bandId')) || this.bandContext.getCurrentBand();
    if (!bandId) {
      this.currentBandLoading.set(false);
      return;
    }

    this.bandContext.setCurrentBand(bandId);
    this.bandService.get(bandId).subscribe({
      next: (band) => {
        this.currentBand.set(band);
        this.currentBandLoading.set(false);
      },
      error: () => this.currentBandLoading.set(false),
    });
  }

  bandInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  sectionHref(section: FlowSection): string {
    const bandId = this.route.snapshot.paramMap.get('bandId') ?? this.bandContext.getCurrentBand();
    if (!bandId) return '/band';

    const routes: Record<FlowSection, string> = {
      home: 'panoramica',
      musica: 'repertorio',
      agenda: 'impegni',
      live: 'scalette',
      band: 'impostazioni',
    };

    return `/band/${bandId}/${routes[section]}`;
  }
}
