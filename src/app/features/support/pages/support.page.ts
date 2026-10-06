import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
    DatePipe,
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
export class SupportPage implements OnInit, OnDestroy {
  private static readonly MAX_SCREENSHOTS = 5;
  private static readonly MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
  private static readonly SCREENSHOT_TYPES = new Set(['image/jpeg', 'image/png']);

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
  screenshots: File[] = [];
  private readonly screenshotPreviews = new Map<File, string>();

  ngOnDestroy(): void {
    this.clearScreenshots();
  }

  private clearScreenshots(): void {
    this.screenshotPreviews.forEach((url) => URL.revokeObjectURL(url));
    this.screenshotPreviews.clear();
    this.screenshots = [];
  }

  screenshotPreview(file: File): string {
    return this.screenshotPreviews.get(file) ?? '';
  }

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
    this.clearScreenshots();
  }

  onScreenshotsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (this.saving() || !files.length) return;

    const newFiles = files.filter((file) => !this.screenshots.some((selected) =>
      selected.name === file.name && selected.size === file.size && selected.lastModified === file.lastModified,
    ));

    if (this.screenshots.length + newFiles.length > SupportPage.MAX_SCREENSHOTS) {
      this.error.set(`Puoi allegare al massimo ${SupportPage.MAX_SCREENSHOTS} screenshot.`);
      input.value = '';
      return;
    }

    const invalidType = files.find((file) => !SupportPage.SCREENSHOT_TYPES.has(file.type));
    if (invalidType) {
      this.error.set('Gli screenshot devono essere in formato JPG o PNG.');
      input.value = '';
      return;
    }

    const tooLarge = files.find((file) => file.size > SupportPage.MAX_SCREENSHOT_SIZE);
    if (tooLarge) {
      this.error.set(`Ogni screenshot può pesare al massimo 5 MB (${tooLarge.name} è troppo grande).`);
      input.value = '';
      return;
    }

    this.error.set(null);
    newFiles.forEach((file) => this.screenshotPreviews.set(file, URL.createObjectURL(file)));
    this.screenshots = [...this.screenshots, ...newFiles];
  }

  removeScreenshot(index: number): void {
    if (this.saving()) return;
    const file = this.screenshots[index];
    const preview = this.screenshotPreviews.get(file);
    if (preview) URL.revokeObjectURL(preview);
    this.screenshotPreviews.delete(file);
    this.screenshots = this.screenshots.filter((_, currentIndex) => currentIndex !== index);
  }

  fileSize(file: File): string {
    return `${(file.size / 1024 / 1024).toFixed(1)} MB`;
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
      screenshots: this.screenshots,
    }).subscribe({
      next: (ticket) => {
        this.selectedTicket.set(ticket);
        this.creating.set(false);
        this.saving.set(false);
        this.clearScreenshots();
        this.loadTickets();
      },
      error: () => {
        this.error.set('Non riesco ad aprire il ticket. Controlla formato e dimensione degli screenshot e riprova.');
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
