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
  IonSplitPane,
  isPlatform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  colorPaletteOutline,
  homeOutline,
  listOutline,
  micOutline,
  musicalNotesOutline,
  pinOutline,
  radioOutline,
  settingsOutline,
} from 'ionicons/icons';
import { BandContextService } from '../core/services/band-context.service';
import { Band } from '../features/bands/models/band.models';
import { BandService } from '../features/bands/services/band.service';

type BandSection = 'panoramica' | 'repertorio' | 'prove' | 'concerti' | 'luoghi' | 'scalette' | 'locandine' | 'impostazioni';

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
    IonSplitPane,
  ],
})
export class BandLayoutPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);
  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');
  readonly menuCollapsed = signal(false);
  readonly currentBand = signal<Band | null>(null);
  readonly currentBandLoading = signal(true);

  readonly sections: Array<{
    key: BandSection;
    label: string;
    icon: string;
  }> = [
    { key: 'panoramica', label: 'Panoramica', icon: 'home-outline' },
    { key: 'repertorio', label: 'Repertorio', icon: 'musical-notes-outline' },
    { key: 'prove', label: 'Prove', icon: 'mic-outline' },
    { key: 'concerti', label: 'Concerti', icon: 'radio-outline' },
    { key: 'luoghi', label: 'Luoghi', icon: 'pin-outline' },
    { key: 'scalette', label: 'Scalette', icon: 'list-outline' },
    { key: 'locandine', label: 'Locandine', icon: 'color-palette-outline' },
    { key: 'impostazioni', label: 'Impostazioni', icon: 'settings-outline' },
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      colorPaletteOutline,
      homeOutline,
      listOutline,
      micOutline,
      musicalNotesOutline,
      pinOutline,
      radioOutline,
      settingsOutline,
    });
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

  sectionHref(section: BandSection): string {
    const bandId = this.route.snapshot.paramMap.get('bandId') ?? this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}/${section}` : '/band';
  }

  handleLayoutClick(event: MouseEvent): void {
    if (!window.matchMedia('(min-width: 600px)').matches) return;
    const path = event.composedPath();
    const menuButtonClicked = path.some((target) => target instanceof HTMLElement && target.tagName === 'ION-MENU-BUTTON');
    if (!menuButtonClicked) return;
    event.preventDefault();
    event.stopPropagation();
    this.menuCollapsed.update((collapsed) => !collapsed);
  }
}
