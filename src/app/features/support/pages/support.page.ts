import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bugOutline,
  bulbOutline,
  checkmarkCircleOutline,
  helpBuoyOutline,
  helpCircleOutline,
  sendOutline,
} from 'ionicons/icons';
import { finalize } from 'rxjs';
import { BandContextService } from '../../../core/services/band-context.service';
import {
  SupportCategory,
  SupportTicketService,
} from '../services/support-ticket.service';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonToolbar,
  ],
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
})
export class SupportPage {
  private readonly support = inject(SupportTicketService);
  private readonly bandContext = inject(BandContextService);

  category: SupportCategory = 'bug';
  subject = '';
  description = '';

  readonly sending = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly categories: Array<{ value: SupportCategory; label: string; icon: string; hint: string }> = [
    { value: 'bug', label: 'Bug', icon: 'bug-outline', hint: 'Qualcosa non funziona come dovrebbe.' },
    { value: 'suggestion', label: 'Suggerimento', icon: 'bulb-outline', hint: 'Un’idea per migliorare GigSaw.' },
    { value: 'support', label: 'Assistenza', icon: 'help-buoy-outline', hint: 'Hai bisogno di una mano.' },
    { value: 'other', label: 'Altro', icon: 'help-circle-outline', hint: 'Qualsiasi altra segnalazione.' },
  ];

  constructor() {
    addIcons({
      bugOutline,
      bulbOutline,
      checkmarkCircleOutline,
      helpBuoyOutline,
      helpCircleOutline,
      sendOutline,
    });
  }

  submit(): void {
    const subject = this.subject.trim();
    const description = this.description.trim();

    this.successMessage.set('');
    this.errorMessage.set('');

    if (!subject || !description) {
      this.errorMessage.set('Inserisci oggetto e descrizione.');
      return;
    }

    this.sending.set(true);

    this.support.create({
      category: this.category,
      subject,
      description,
      band_id: this.bandContext.getCurrentBand(),
      context: {
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      },
    }).pipe(
      finalize(() => this.sending.set(false)),
    ).subscribe({
      next: (response) => {
        const ticketNumber = response.ticket?.number ? ` Ticket #${response.ticket.number}.` : '';
        this.successMessage.set(`${response.message}${ticketNumber}`);
        this.subject = '';
        this.description = '';
        this.category = 'bug';
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ?? 'Non riesco a inviare la segnalazione. Riprova tra poco.',
        );
      },
    });
  }
}
