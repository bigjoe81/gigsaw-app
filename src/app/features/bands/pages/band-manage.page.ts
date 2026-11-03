import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band } from '../models/band.models';
import { BandService } from '../services/band.service';
import { BandProfileSettingsComponent } from '../components/settings/band-profile-settings.component';
import { BandTechSettingsComponent } from '../components/settings/band-tech-settings.component';
import { BandMediaSettingsComponent } from '../components/settings/band-media-settings.component';
import { BandTeamSettingsComponent } from '../components/settings/band-team-settings.component';
import { BandInvitesSettingsComponent } from '../components/settings/band-invites-settings.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    NativeUiModule,
    RouterLink,
    BandProfileSettingsComponent,
    BandTechSettingsComponent,
    BandMediaSettingsComponent,
    BandTeamSettingsComponent,
    BandInvitesSettingsComponent,
  ],
  templateUrl: './band-manage.page.html',
  styleUrl: './band-manage.page.scss',
})
export class BandManagePage implements OnInit {
  readonly settingsSection = signal<
    'overview' | 'profile' | 'tech' | 'media' | 'team' | 'invites' | 'notifications' | 'billing'
  >('overview');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);

  private readonly destroyRef = inject(DestroyRef);
  private bandId!: number;
  band?: Band;
  readonly loading = signal(true);
  readonly loadError = signal('');
  get isAdmin(): boolean {
    return this.band?.currentUserRole === 'ADMIN';
  }
  openOnboarding(): void {
    void this.router.navigate(['/inizia'], { queryParams: { ripeti: 1 } });
  }
  readonly sections = [
    {
      key: 'billing',
      path: 'abbonamento',
      title: 'Abbonamento',
      description: 'Piano della band, Beta e pagamenti.',
      icon: 'options-outline',
      admin: true,
    },
    {
      key: 'profile',
      path: 'profilo',
      title: 'Profilo',
      description: 'Identità, biografia e contatti della band.',
      icon: 'person-circle-outline',
      admin: true,
    },
    {
      key: 'tech',
      path: 'scheda-tecnica',
      title: 'Scheda tecnica',
      description: 'Canali audio, disposizione palco e note per il live.',
      icon: 'options-outline',
      admin: true,
    },
    {
      key: 'media',
      path: 'media',
      title: 'Media e press kit',
      description: 'Foto promozionali e materiali da condividere.',
      icon: 'images-outline',
      admin: true,
    },
    {
      key: 'team',
      path: 'membri',
      title: 'Membri',
      description: 'Musicisti, strumenti e ruoli nella band.',
      icon: 'people-outline',
      admin: false,
    },
    {
      key: 'invites',
      path: 'inviti',
      title: 'Inviti',
      description: 'Link di accesso, inviti personalizzati e richieste pendenti.',
      icon: 'mail-outline',
      admin: true,
    },
    {
      key: 'notifications',
      path: 'notifiche',
      title: 'Notifiche email',
      description: 'Decidi quali aggiornamenti importanti inviare ai membri.',
      icon: 'notifications-outline',
      admin: true,
    },
  ] as const;
  get visibleSections() {
    return this.sections.filter((section) => !section.admin || this.isAdmin);
  }
  get currentSection() {
    return this.sections.find((section) => section.key === this.settingsSection());
  }

  settingsUrl(path = ''): string {
    return `/band/${this.bandId}/impostazioni${path ? '/' + path : ''}`;
  }

  private syncSection(path: string | null): void {
    const section = this.sections.find((item) => item.path === path);
    if (path && (!section || (this.band && section.admin && !this.isAdmin))) {
      void this.router.navigateByUrl(this.settingsUrl(), { replaceUrl: true });
      return;
    }
    this.settingsSection.set(section?.key ?? 'overview');
  }

  ngOnInit(): void {
    const bandId = this.getBandId();
    if (!bandId) {
      this.loadError.set('Band non trovata.');
      this.loading.set(false);
      return;
    }

    this.bandId = bandId;
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.syncSection(params.get('section'));
    });
    this.load();
  }

  load(): void {
    this.loading.set(!this.band);
    this.loadError.set('');
    this.bandService
      .get(this.bandId)
      .pipe(
        timeout({ first: 15000 }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (band) => {
          this.band = band;
          this.syncSection(this.route.snapshot.paramMap.get('section'));
        },
        error: (error: { error?: { message?: string } }) => {
          this.loadError.set(error.error?.message || 'Impossibile caricare le impostazioni della band. Riprova.');
        },
      });
  }

  private getBandId(): number | undefined {
    const segments = [
      this.route.snapshot,
      this.route.parent?.snapshot,
      this.route.parent?.parent?.snapshot,
      this.route.parent?.parent?.parent?.snapshot,
    ];

    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        this.bandContext.setCurrentBand(value);
        return value;
      }
    }

    const currentBandId = this.bandContext.getCurrentBand();
    if (Number.isInteger(currentBandId) && currentBandId! > 0) {
      return currentBandId!;
    }

    return undefined;
  }
}
