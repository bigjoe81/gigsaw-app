import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, musicalNotesOutline, radioOutline, micOutline } from 'ionicons/icons';
import { BandService } from '../bands/services/band.service';
import { GUIDE_GOALS, GuideGoal, parseGuideGoal } from './guide-goals';
import { GUIDED_COMPLETIONS, GuidedCompletion, parseGuidedCompletion } from './guided-navigation';

interface Choice { title: string; text: string; route: string; }

@Component({
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink],
  templateUrl: './guide.page.html',
  styleUrls: ['./guide.page.scss'],
})
export class GuidePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bands = inject(BandService);
  readonly bandId = Number(this.route.snapshot.paramMap.get('bandId'));
  readonly baseUrl = `/band/${this.bandId}`;
  readonly bandName = signal('La tua band');
  readonly goal = signal<GuideGoal | null>(null);
  readonly goals = GUIDE_GOALS;
  readonly completed = signal<GuidedCompletion | null>(null);
  readonly completionTitles = GUIDED_COMPLETIONS;
  readonly nextStep = computed<Choice | null>(() => {
    switch (this.completed()) {
      case 'repertorio':
      case 'importazione': return { title: 'Organizziamo una prova', text: 'Scegli quando lavorare sui brani.', route: 'prove/nuova' };
      case 'concerto': return { title: 'Prepariamo la scaletta', text: 'Scegli i brani per il live.', route: 'scalette/nuova' };
      case 'prova': return { title: 'Vediamo cosa preparare', text: 'Apri i prossimi impegni della band.', route: 'impegni' };
      case 'scaletta': return { title: 'Vediamo i prossimi impegni', text: 'Riprendi le prove e i concerti in programma.', route: 'impegni' };
      default: return null;
    }
  });
  readonly questions: Record<GuideGoal, string> = {
    repertoire: 'Avete già una lista di brani?',
    gig: 'A che punto siete con il concerto?',
    rehearsal: 'Da cosa vuoi partire per la prova?',
  };
  readonly answers: Record<GuideGoal, Choice[]> = {
    repertoire: [
      { title: 'Sì, voglio importarla', text: 'Porta qui la vostra lista di brani.', route: 'repertorio/importa' },
      { title: 'Aggiungiamo un brano', text: 'Basta il primo per cominciare.', route: 'repertorio/nuovo' },
      { title: 'Lavoriamo sui brani già presenti', text: 'Riprendi il vostro repertorio.', route: 'repertorio' },
    ],
    gig: [
      { title: 'Abbiamo una nuova data', text: 'Aggiungi il prossimo concerto.', route: 'concerti/nuovo' },
      { title: 'Voglio preparare la scaletta', text: 'Scegli e ordina i brani da suonare.', route: 'scalette/nuova' },
      { title: 'Riprendiamo un concerto già inserito', text: 'Apri le date della band.', route: 'concerti' },
    ],
    rehearsal: [
      { title: 'Fissiamo una nuova prova', text: 'Scegli data, orario e brani.', route: 'prove/nuova' },
      { title: 'Scegliamo cosa provare', text: 'Guarda i brani su cui lavorare.', route: 'repertorio' },
      { title: 'Riprendiamo una prova già organizzata', text: 'Apri le prove della band.', route: 'prove' },
    ],
  };

  constructor() {
    addIcons({ chevronForwardOutline, musicalNotesOutline, radioOutline, micOutline });
    this.bands.get(this.bandId).subscribe({
      next: (band) => this.bandName.set(band.name),
      error: () => {},
    });
  }

  ionViewWillEnter(): void {
    this.completed.set(parseGuidedCompletion(this.route.snapshot.queryParamMap.get('completato')));
    this.goal.set(parseGuideGoal(this.route.snapshot.queryParamMap.get('obiettivo')));
  }

  chooseGoal(goal: GuideGoal): void {
    this.completed.set(null);
    this.goal.set(goal);
  }

  open(choice: Choice): void {
    void this.router.navigate([this.baseUrl, ...choice.route.split('/')], {
      queryParams: { guidato: 1, obiettivo: this.goal() },
    });
  }
}
