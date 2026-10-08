import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonChip, IonContent, IonIcon, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronForwardOutline,
  flameOutline,
  folderOpenOutline,
  musicalNotesOutline,
  peopleOutline,
  personAddOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { catchError, finalize, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BandContextService } from '../../core/services/band-context.service';
import { BandFlow, BandFlowService } from '../../core/services/band-flow.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { Band, BandGenre } from '../bands/models/band.models';
import { BandService } from '../bands/services/band.service';
import { GenreService } from '../bands/services/genre.service';

type OnboardingMode = 'create' | 'invite';
type OnboardingStep = 'welcome' | 'invite' | 'profile' | 'band' | 'flow' | 'source';
type BuildingStart = 'manual' | 'import';

@Component({
  standalone: true,
  imports: [IonButton, IonChip, IonContent, IonIcon, IonInput, IonSpinner],
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
  private readonly bandFlow = inject(BandFlowService);

  readonly step = signal<OnboardingStep>('welcome');
  readonly mode = signal<OnboardingMode | null>(null);
  readonly selectedFlow = signal<BandFlow | null>(null);
  readonly recalibrating = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly genres = signal<BandGenre[]>([]);
  readonly selectedGenreIds = signal<number[]>([]);
  readonly instruments = signal<string[]>([]);
  readonly showAllInstruments = signal(false);
  readonly showGenres = signal(false);

  readonly primaryInstruments = ['Voce', 'Chitarra', 'Basso', 'Batteria', 'Pianoforte', 'Tastiere'];
  readonly instrumentPresets = ['Voce', 'Chitarra', 'Basso', 'Batteria', 'Pianoforte', 'Tastiere', 'Percussioni', 'Hammond', 'Synth', 'Armonica', 'Sassofono', 'Tromba', 'Violino', 'Contrabbasso'];

  bandName = '';
  joinCode = '';
  customInstrument = '';
  currentBand?: Band;

  constructor() {
    addIcons({
      arrowBackOutline,
      chevronForwardOutline,
      flameOutline,
      folderOpenOutline,
      musicalNotesOutline,
      peopleOutline,
      personAddOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    this.genresService.list().pipe(catchError(() => of([]))).subscribe((genres) => this.genres.set(genres));

    const bandId = Number(this.route.snapshot.queryParamMap.get('bandId'));
    const recalibrate = this.route.snapshot.queryParamMap.get('percorso') === '1';
    if (Number.isInteger(bandId) && bandId > 0) {
      this.loading.set(true);
      this.bandService.get(bandId).pipe(finalize(() => this.loading.set(false))).subscribe({
        next: (band) => {
          this.currentBand = band;
          this.bandContext.setCurrentBand(band.id);

          if (recalibrate) {
            this.recalibrating.set(true);
            this.mode.set('create');
            this.selectedFlow.set(this.bandFlow.get(band.id));
            this.step.set('flow');
            return;
          }

          this.mode.set('invite');
          const currentMember = band.members?.find((member) => member.id === this.auth.currentUser()?.id);
          this.instruments.set(currentMember?.instruments ?? []);
          this.step.set('profile');
        },
        error: () => {
          this.error.set(recalibrate ? 'Non riesco a recuperare la band.' : 'Non riesco a recuperare la band dell’invito.');
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
    if (current === 'profile' || current === 'invite') return 2;
    if (current === 'band') return 3;
    if (current === 'flow') return 4;
    return 5;
  }

  get visibleInstruments(): string[] {
    return this.showAllInstruments() ? this.instrumentPresets : this.primaryInstruments;
  }

  chooseMode(mode: OnboardingMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.step.set(mode === 'create' ? 'profile' : 'invite');
  }

  continueFromProfile(): void {
    this.addCustomInstruments();
    if (this.currentBand) this.saveInstruments();
    else if (this.mode() === 'create') this.step.set('band');
  }

  toggleInstrument(instrument: string): void {
    this.instruments.update((current) => current.includes(instrument)
      ? current.filter((item) => item !== instrument)
      : [...current, instrument]);
  }

  toggleGenre(id?: number): void {
    if (!Number.isInteger(id)) return;
    this.selectedGenreIds.update((current) => current.includes(id!)
      ? current.filter((genreId) => genreId !== id!)
      : [...current, id!]);
  }

  isGenreSelected(id?: number): boolean {
    return Number.isInteger(id) && this.selectedGenreIds().includes(id!);
  }

  createBand(): void {
    const name = this.bandName.trim();
    if (!name || this.loading()) {
      this.error.set('Come si chiama la band?');
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
      next: () => this.step.set('flow'),
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

  chooseFlow(flow: BandFlow): void {
    if (!this.currentBand) return;

    this.selectedFlow.set(flow);
    this.bandFlow.set(this.currentBand.id, flow);

    if (flow === 'building') {
      this.step.set('source');
      return;
    }

    if (flow === 'importing') {
      this.finish('import');
      return;
    }

    this.finish();
  }

  joinBand(): void {
    const code = this.joinCode.trim();
    if (!code || this.loading()) {
      this.error.set('Inserisci il codice ricevuto con l’invito.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.bandService.join(code).pipe(finalize(() => this.loading.set(false))).subscribe({
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

    if (this.step() === 'source') {
      this.step.set('flow');
      return;
    }
    if (this.step() === 'flow' && this.recalibrating()) {
      this.returnToBand();
      return;
    }
    if (this.step() === 'flow') this.step.set('band');
    else if (this.step() === 'band') this.step.set('profile');
    else if (this.step() === 'invite') this.step.set('welcome');
    else if (this.step() === 'profile' && this.mode() === 'invite' && this.currentBand) this.returnToBand();
    else {
      this.mode.set(null);
      this.currentBand = undefined;
      this.selectedFlow.set(null);
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
    if (this.recalibrating()) {
      this.returnToBand();
      return;
    }
    this.onboarding.complete();
    void this.router.navigateByUrl(this.currentBand ? `/band/${this.currentBand.id}/panoramica` : '/band');
  }

  finish(buildingStart: BuildingStart = 'manual'): void {
    this.onboarding.complete();
    if (!this.currentBand) {
      void this.router.navigateByUrl('/band');
      return;
    }

    const base = `/band/${this.currentBand.id}`;
    const flow = this.selectedFlow() ?? this.bandFlow.get(this.currentBand.id);

    if (flow === 'building') {
      void this.router.navigateByUrl(buildingStart === 'import' ? `${base}/repertorio/importa` : `${base}/repertorio/nuovo`);
      return;
    }
    if (flow === 'importing') {
      void this.router.navigateByUrl(`${base}/repertorio/importa`);
      return;
    }

    void this.router.navigateByUrl(`${base}/panoramica`);
  }

  private returnToBand(): void {
    void this.router.navigateByUrl(this.currentBand ? `/band/${this.currentBand.id}/panoramica` : '/band');
  }

  private saveInstruments(): void {
    if (!this.currentBand || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.saveCurrentMemberInstruments(this.currentBand).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.returnToBand(),
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
