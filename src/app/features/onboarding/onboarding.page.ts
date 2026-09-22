import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  musicalNotesOutline,
  peopleOutline,
  personAddOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { catchError, finalize, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BandContextService } from '../../core/services/band-context.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { Band, BandGenre } from '../bands/models/band.models';
import { BandService } from '../bands/services/band.service';
import { GenreService } from '../bands/services/genre.service';

type OnboardingMode = 'create' | 'invite';
type OnboardingStep = 'welcome' | 'profile' | 'band' | 'invite' | 'complete';

@Component({
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
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
  currentBand?: Band;

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      musicalNotesOutline,
      peopleOutline,
      personAddOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    this.genresService.list().pipe(
      catchError(() => of([])),
    ).subscribe((genres) => this.genres.set(genres));

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
    if (current === 'complete') return 4;
    if (current === 'profile') return this.mode() === 'invite' && this.currentBand ? 3 : 2;
    return 3;
  }

  chooseMode(mode: OnboardingMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.step.set(mode === 'create' ? 'profile' : 'invite');
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
    const name = this.bandName.trim();
    if (!name || this.loading()) {
      this.error.set('Inserisci il nome della band.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.bandService.create({ name, genres: this.selectedGenreIds() }).pipe(
      switchMap((band) => {
        this.currentBand = band;
        this.bandContext.setCurrentBand(band.id);
        return this.saveCurrentMemberInstruments(band);
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => this.step.set('complete'),
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        if (this.currentBand) {
          this.step.set('profile');
          this.error.set('La band è stata creata, ma non sono riuscito a salvare gli strumenti. Riprova.');
          return;
        }
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
    if (this.step() === 'band') {
      this.step.set('profile');
    } else if (this.step() === 'profile' && this.mode() === 'invite' && this.currentBand) {
      this.step.set('complete');
    } else {
      this.mode.set(null);
      this.currentBand = undefined;
      this.step.set('welcome');
    }
  }

  backFromProfile(): void {
    if (this.mode() === 'invite' && this.currentBand) {
      this.skip();
      return;
    }

    this.back();
  }

  skip(): void {
    this.onboarding.complete();
    void this.router.navigateByUrl(this.currentBand ? `/band/${this.currentBand.id}/panoramica` : '/band');
  }

  finish(): void {
    this.onboarding.complete();
    void this.router.navigateByUrl(this.currentBand ? `/band/${this.currentBand.id}/panoramica` : '/band');
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
