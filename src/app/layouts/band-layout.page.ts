import { Component, EnvironmentInjector, inject, signal } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  albumsOutline,
  arrowBackOutline,
  colorPaletteOutline,
  homeOutline,
  listOutline,
  micOutline,
  musicalNotesOutline,
  peopleOutline,
  radioOutline,
} from 'ionicons/icons';
import { BandContextService } from '../core/services/band-context.service';

type BandSection = 'dashboard' | 'repertorio' | 'prove' | 'concerti' | 'scalette' | 'locandine' | 'band';

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
export class BandLayoutPage {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  readonly menuCollapsed = signal(false);

  readonly sections: Array<{
    key: BandSection;
    label: string;
    icon: string;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
    { key: 'repertorio', label: 'Repertorio', icon: 'musical-notes-outline' },
    { key: 'prove', label: 'Prove', icon: 'mic-outline' },
    { key: 'concerti', label: 'Concerti', icon: 'radio-outline' },
    { key: 'scalette', label: 'Scalette', icon: 'list-outline' },
    { key: 'locandine', label: 'Locandine', icon: 'color-palette-outline' },
    { key: 'band', label: 'Band', icon: 'people-outline' },
  ];

  constructor() {
    addIcons({
      albumsOutline,
      arrowBackOutline,
      colorPaletteOutline,
      homeOutline,
      listOutline,
      micOutline,
      musicalNotesOutline,
      peopleOutline,
      radioOutline,
    });
  }

  sectionHref(section: BandSection): string {
    const bandId = this.route.snapshot.paramMap.get('bandId') ?? this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}/${section}` : '/bands';
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
