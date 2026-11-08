import { ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NativeUiModule } from '../shared/ui/native-ui';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { BandContextService } from '../core/services/band-context.service';
import { Band, BandService } from '../features/bands/api';

type FlowSection =
  | 'home'
  | 'musica'
  | 'prove'
  | 'concerti'
  | 'locali'
  | 'agenda'
  | 'live'
  | 'locandine'
  | 'band';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-band-layout',
  templateUrl: './band-layout.page.html',
  styleUrls: ['./band-layout.page.scss'],
  standalone: true,
  imports: [RouterOutlet, NativeUiModule, RouterLink, RouterLinkActive],
})
export class BandLayoutPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);
  readonly pageTransitionsEnabled = false;
  readonly menuCollapsed = signal(false);
  readonly currentBand = signal<Band | null>(null);
  readonly currentBandLoading = signal(true);

  readonly sections: Array<{
    key: FlowSection;
    label: string;
    icon: string;
    hint: string;
  }> = [
    {
      key: 'home',
      label: 'Panoramica',
      icon: 'home-outline',
      hint: 'Cosa viene dopo',
    },
    {
      key: 'agenda',
      label: 'Impegni',
      icon: 'calendar-outline',
      hint: 'Prove, live e impegni',
    },
    {
      key: 'musica',
      label: 'Repertorio',
      icon: 'musical-notes-outline',
      hint: 'Brani e repertorio',
    },
    {
      key: 'live',
      label: 'Scalette',
      icon: 'list-outline',
      hint: 'Scalette e palco',
    },
    {
      key: 'prove',
      label: 'Prove',
      icon: 'mic-outline',
      hint: 'Sessioni e registrazioni',
    },
    {
      key: 'concerti',
      label: 'Concerti',
      icon: 'radio-outline',
      hint: 'Date e palco',
    },
    {
      key: 'locali',
      label: 'Locali',
      icon: 'location-outline',
      hint: 'Dove suoniamo',
    },
    {
      key: 'locandine',
      label: 'Modelli di locandina',
      icon: 'color-palette-outline',
      hint: 'Modelli e formati per i concerti',
    },
    {
      key: 'band',
      label: 'Band e impostazioni',
      icon: 'people-outline',
      hint: 'Persone e profilo',
    },
  ];

  ngOnInit(): void {
    const bandId =
      Number(this.route.snapshot.paramMap.get('bandId')) ||
      this.bandContext.getCurrentBand();
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
    const bandId =
      this.route.snapshot.paramMap.get('bandId') ??
      this.bandContext.getCurrentBand();
    if (!bandId) return '/band';

    const routes: Record<FlowSection, string> = {
      home: 'panoramica',
      musica: 'repertorio',
      prove: 'prove',
      concerti: 'concerti',
      locali: 'luoghi',
      agenda: 'impegni',
      live: 'scalette',
      locandine: 'locandine',
      band: 'impostazioni',
    };

    return `/band/${bandId}/${routes[section]}`;
  }
  get userName(): string {
    return this.auth.currentUser()?.name || 'Il tuo profilo';
  }
  get userInitials(): string {
    return this.bandInitials(this.userName);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout().subscribe();
  }

  closeMobileMenu(): void {
    this.menuCollapsed.set(false);
  }
  handleLayoutClick(event: MouseEvent): void {
    if (
      event
        .composedPath()
        .some(
          (target) =>
            target instanceof HTMLElement &&
            target.hasAttribute('data-menu-toggle'),
        )
    ) {
      event.preventDefault();
      this.menuCollapsed.update((value) => !value);
    }
  }
}
