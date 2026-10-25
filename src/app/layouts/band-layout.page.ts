import { ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NativeUiModule } from '../shared/ui/native-ui';
import { Component, EnvironmentInjector, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { BandContextService } from '../core/services/band-context.service';
import { Band } from '../features/bands/models/band.models';
import { BandService } from '../features/bands/services/band.service';

type FlowSection = 'home' | 'musica' | 'prove' | 'concerti' | 'locali' | 'agenda' | 'live' | 'band';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-band-layout',
  templateUrl: './band-layout.page.html',
  styleUrls: ['./band-layout.page.scss'],
  standalone: true,
  imports: [RouterOutlet, NativeUiModule,
    RouterLink,
    RouterLinkActive,
    ],
})
export class BandLayoutPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);
  readonly pageTransitionsEnabled = false;
  readonly menuCollapsed = signal(false);
  readonly currentBand = signal<Band | null>(null);
  readonly currentBandLoading = signal(true);

  readonly sections: Array<{ key: FlowSection; label: string; icon: string; hint: string }> = [
    { key: 'home', label: 'Home', icon: 'home-outline', hint: 'Cosa viene dopo' },
    { key: 'musica', label: 'Musica', icon: 'musical-notes-outline', hint: 'Brani e repertorio' },
    { key: 'prove', label: 'Prove', icon: 'mic-outline', hint: 'Sessioni e registrazioni' },
    { key: 'concerti', label: 'Concerti', icon: 'radio-outline', hint: 'Date e palco' },
    { key: 'locali', label: 'Locali', icon: 'location-outline', hint: 'Dove suoniamo' },
    { key: 'agenda', label: 'Agenda', icon: 'calendar-outline', hint: 'Prove, live e impegni' },
    { key: 'live', label: 'Live', icon: 'list-outline', hint: 'Scalette e palco' },
    { key: 'band', label: 'Band', icon: 'people-outline', hint: 'Persone e profilo' },
  ];



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
      prove: 'prove',
      concerti: 'concerti',
      locali: 'luoghi',
      agenda: 'impegni',
      live: 'scalette',
      band: 'impostazioni',
    };

    return `/band/${bandId}/${routes[section]}`;
  }
  closeMobileMenu(): void { this.menuCollapsed.set(false); }
  handleLayoutClick(event: MouseEvent): void {
    if (event.composedPath().some(target => target instanceof HTMLElement && target.hasAttribute('data-menu-toggle'))) {
      event.preventDefault();
      this.menuCollapsed.update(value => !value);
    }
  }
}
