import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, musicalNotesOutline, radioOutline, micOutline } from 'ionicons/icons';
import { BandService } from '../bands/services/band.service';

type Goal = 'repertoire' | 'gig' | 'rehearsal';
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
  readonly goal = signal<Goal | null>(null);
  readonly goals: Array<{ key: Goal; title: string; text: string; icon: string }> = [
    { key: 'repertoire', title: 'Costruire il repertorio', text: 'Aggiungiamo i brani che volete suonare.', icon: 'musical-notes-outline' },
    { key: 'gig', title: 'Preparare un concerto', text: 'Partiamo dalla data o dalla scaletta.', icon: 'radio-outline' },
    { key: 'rehearsal', title: 'Organizzare una prova', text: 'Decidiamo quando trovarci o cosa suonare.', icon: 'mic-outline' },
  ];
  readonly questions: Record<Goal, string> = {
    repertoire: 'Avete già una lista di brani?',
    gig: 'A che punto siete con il concerto?',
    rehearsal: 'Da cosa vuoi partire per la prova?',
  };
  readonly answers: Record<Goal, Choice[]> = {
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
    this.goal.set(null);
  }

  open(choice: Choice): void {
    void this.router.navigate([this.baseUrl, ...choice.route.split('/')], {
      queryParams: { guidato: 1 },
    });
  }
}
