import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, Observable, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BandContextService } from '../../core/services/band-context.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { Band, BandGenre } from '../bands/models/band.models';
import { BandService } from '../bands/services/band.service';
import { GenreService } from '../bands/services/genre.service';

type OnboardingMode = 'create' | 'invite';
type OnboardingStep = 'welcome' | 'profile' | 'band' | 'invite' | 'complete' | 'songs';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, GigsawFormControlsModule],
  templateUrl: './onboarding.page.html',
})
export class OnboardingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly bandService = inject(BandService);
  private readonly genresService = inject(GenreService);
  private readonly bandContext = inject(BandContextService);
  private readonly onboarding = inject(OnboardingService);

  readonly step = signal<OnboardingStep>('welcome');
  readonly mode = signal<OnboardingMode | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly genres = signal<BandGenre[]>([]);
  readonly selectedGenreIds = signal<number[]>([]);
  readonly instruments = signal<string[]>([]);
  readonly instrumentPresets = ['Voce', 'Chitarra', 'Basso', 'Batteria', 'Percussioni', 'Pianoforte', 'Tastiere', 'Hammond', 'Synth', 'Armonica', 'Sassofono', 'Tromba', 'Violino', 'Contrabbasso'];

  bandName = '';
  joinCode = '';
  customInstrument = '';
  instrumentFilter = '';
  genreFilter = '';
  currentBand?: Band;

  get filteredGenres(): BandGenre[] {
    const query = this.normalizeSearch(this.genreFilter.trim());
    const selectedGenreIds = new Set(this.selectedGenreIds());

    return this.genres()
      .filter((genre) => genre.name && this.normalizeSearch(genre.name).includes(query))
      .sort((first, second) => Number(selectedGenreIds.has(second.id ?? -1)) - Number(selectedGenreIds.has(first.id ?? -1)));
  }

  get filteredInstrumentPresets(): string[] {
    const query = this.normalizeSearch(this.instrumentFilter.trim());
    if (!query) return this.instrumentPresets;

    return this.instrumentPresets.filter((instrument) =>
      this.normalizeSearch(instrument).includes(query),
    );
  }

  constructor() {

  }

  ngOnInit(): void {
    this.genresService.list().pipe(
      catchError(() => of([])),
    ).subscribe((genres) => this.genres.set(genres));

    if (this.route.snapshot.queryParamMap.get('mode') === 'create') {
      this.mode.set('create');
      this.step.set('band');
    }

    const bandId = Number(this.route.snapshot.queryParamMap.get('bandId'));
    if (Number.isInteger(bandId) && bandId > 0) {
      this.mode.set('invite');
      this.loading.set(true);
      this.bandService.get(bandId).pipe(
        finalize(() => this.loading.set(false)),
      ).subscribe({
        next: (band) => {
          this.currentBand = band;
          const currentMember = band.members?.find((member) => member.id === this.auth.currentUser()?.id);
          this.instruments.set(currentMember?.instruments ?? []);
          this.step.set('profile');
        },
        error: () => {
          this.error.set('Non riesco a recuperare la band dell’invito.');
          this.step.set('welcome');
        },
      });
    }
  }

  get userName(): string {
    return this.auth.currentUser()?.name || 'Musicista';
  }

  get progress(): number {
    const current = this.step();
    if (current === 'welcome') return 1;
    if (current === 'complete' || current === 'songs') return 4;
    if (current === 'profile' && this.currentBand) return 3;
    return 2;
  }

  chooseMode(mode: OnboardingMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.step.set(mode === 'create' ? 'band' : 'invite');
  }

  continueFromProfile(): void {
    this.addCustomInstruments();
    if (this.currentBand) {
      this.saveInstruments();
    } else if (this.mode() === 'create') {
      this.step.set('band');
    }
  }

  toggleInstrument(instrument: string): void {
    this.instruments.update((current) => current.includes(instrument)
      ? current.filter((item) => item !== instrument)
      : [...current, instrument]);
  }

  private normalizeSearch(value: string): string {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
  }

  toggleGenre(id?: number): void {
    if (!Number.isInteger(id)) return;
    this.selectedGenreIds.update((current) => current.includes(id!)
      ? current.filter((genreId) => genreId !== id)
      : [...current, id!]);
  }

  isGenreSelected(id?: number): boolean {
    return Number.isInteger(id) && this.selectedGenreIds().includes(id!);
  }

  createBand(): void {
    if (this.loading()) return;
    const name = this.bandName.trim();
    if (!name) {
      this.error.set('Inserisci il nome della band.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.bandService.create({ name, genres: this.selectedGenreIds() }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (band) => {
        this.currentBand = band;
        this.bandContext.setCurrentBand(band.id);
        this.step.set('profile');
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.error.set(error.error?.errors?.['name']?.[0] || error.error?.message || 'Creazione della band non riuscita.');
      },
    });
  }

  joinBand(): void {
    const code = this.joinCode.trim();
    if (!code || this.loading()) {
      this.error.set('Inserisci il codice ricevuto con l’invito.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.bandService.join(code).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (band) => {
        this.currentBand = band;
        this.bandContext.setCurrentBand(band.id);
        this.step.set('profile');
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.error.set(error.error?.errors?.['join_code']?.[0] || error.error?.message || 'Codice invito non valido.');
      },
    });
  }

  back(): void {
    this.error.set('');
    if (this.step() === 'songs') {
      this.step.set('complete');
    } else if (this.step() === 'band') {
      this.mode.set(null);
      this.step.set('welcome');
    } else if (this.step() === 'profile' && this.mode() === 'invite' && this.currentBand) {
      this.step.set('complete');
    } else {
      this.mode.set(null);
      this.currentBand = undefined;
      this.step.set('welcome');
    }
  }

  backFromProfile(): void {
    if (this.mode() === 'create' && this.currentBand) {
      this.step.set('complete');
      return;
    }

    if (this.mode() === 'invite' && this.currentBand) {
      this.skip();
      return;
    }

    this.back();
  }

  skip(): void {
    this.onboarding.complete();
    if (!this.currentBand) {
      void this.router.navigate(['/band'], { queryParams: { seleziona: 1 } });
      return;
    }
    void this.router.navigateByUrl(`/band/${this.currentBand.id}/panoramica`);
  }

  finish(): void {
    this.onboarding.complete();
    void this.router.navigateByUrl(this.currentBand ? `/band/${this.currentBand.id}/panoramica` : '/band');
  }

  continueToSongs(): void {
    this.step.set('songs');
  }

  importRepertoire(): void {
    this.navigateToSongPage('importa');
  }

  addDraftSong(): void {
    this.navigateToSongPage('nuovo');
  }

  private navigateToSongPage(page: 'importa' | 'nuovo'): void {
    if (!this.currentBand) {
      this.error.set('Seleziona una band prima di aggiungere brani.');
      return;
    }

    this.onboarding.complete();
    void this.router.navigateByUrl(`/band/${this.currentBand.id}/repertorio/${page}`);
  }

  private saveInstruments(): void {
    if (!this.currentBand || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.saveCurrentMemberInstruments(this.currentBand).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => this.step.set('complete'),
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Salvataggio degli strumenti non riuscito.');
      },
    });
  }

  private saveCurrentMemberInstruments(band: Band): Observable<unknown> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return of(null);

    return this.bandService.updateMemberInstruments(band.id, userId, this.instruments());
  }

  private addCustomInstruments(): void {
    const additions = this.customInstrument
      .split(',')
      .map((instrument) => instrument.trim())
      .filter(Boolean);
    if (!additions.length) return;

    this.instruments.update((current) => Array.from(new Set([...current, ...additions])).slice(0, 20));
    this.customInstrument = '';
  }
}
