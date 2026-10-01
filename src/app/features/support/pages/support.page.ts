import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  SupportTicket,
  SupportTicketCategory,
} from '../models/support-ticket.models';
import { SupportTicketService } from '../services/support-ticket.service';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    IonBadge,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonToolbar,
  ],
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
})
export class SupportPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly support = inject(SupportTicketService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly selectedTicket = signal<SupportTicket | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly creating = signal(false);

  subject = '';
  category: SupportTicketCategory = 'question';
  message = '';
  replyMessage = '';

  private get bandId(): number | null {
    const value = this.route.parent?.snapshot.paramMap.get('bandId');
    return value ? Number(value) : null;
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.support.list().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Non riesco a caricare i ticket. Riprova tra poco.');
        this.loading.set(false);
      },
    });
  }

  openTicket(ticket: SupportTicket): void {
    this.creating.set(false);
    this.error.set(null);
    this.support.get(ticket.id).subscribe({
      next: (detail) => this.selectedTicket.set(detail),
      error: () => this.error.set('Non riesco ad aprire il ticket.'),
    });
  }

  startNewTicket(): void {
    this.selectedTicket.set(null);
    this.creating.set(true);
    this.error.set(null);
    this.subject = '';
    this.category = 'question';
    this.message = '';
  }

  createTicket(): void {
    if (!this.subject.trim() || !this.message.trim() || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    this.support.create({
      band_id: this.bandId,
      subject: this.subject.trim(),
      category: this.category,
      message: this.message.trim(),
    }).subscribe({
      next: (ticket) => {
        this.selectedTicket.set(ticket);
        this.creating.set(false);
        this.saving.set(false);
        this.loadTickets();
      },
      error: () => {
        this.error.set('Non riesco ad aprire il ticket.');
        this.saving.set(false);
      },
    });
  }

  sendReply(): void {
    const ticket = this.selectedTicket();
    const message = this.replyMessage.trim();
    if (!ticket || !message || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    this.support.reply(ticket.id, message).subscribe({
      next: (updated) => {
        this.selectedTicket.set(updated);
        this.replyMessage = '';
        this.saving.set(false);
        this.loadTickets();
      },
      error: () => {
        this.error.set('Non riesco a inviare la risposta.');
        this.saving.set(false);
      },
    });
  }

  statusLabel(status: SupportTicket['status']): string {
    return {
      open: 'Aperto',
      in_progress: 'In lavorazione',
      waiting_user: 'Attesa risposta',
      resolved: 'Risolto',
      closed: 'Chiuso',
    }[status];
  }

  categoryLabel(category: SupportTicketCategory): string {
    return {
      bug: 'Bug',
      question: 'Domanda',
      feature: 'Suggerimento',
      billing: 'Pagamenti',
      other: 'Altro',
    }[category];
  }
}
