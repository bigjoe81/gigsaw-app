import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonRefresher,
  IonRefresherContent, IonSkeletonText, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, alertCircleOutline, calendarOutline, downloadOutline, libraryOutline, listOutline,
  musicalNotesOutline, shareSocialOutline,
} from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';
import { Setlist } from '../../../core/models/band-resources.models';
import { SetlistPdfService } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';

type PdfAction = `download-${number}` | `share-${number}` | null;

@Component({
  standalone: true,
  imports: [
    RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton,
    IonRefresher, IonRefresherContent, IonSkeletonText, IonText, IonTitle, IonToolbar,
  ],
  templateUrl: './setlist-list.page.html',
  styleUrl: './setlist-list.page.scss',
})
export class SetlistListPage implements OnInit {
  readonly setlists = signal<Setlist[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly pdfAction = signal<PdfAction>(null);
  readonly totalSongs = computed(() => this.setlists().reduce((total, setlist) => total + this.songCount(setlist), 0));

  constructor(
    private readonly setlistsApi: SetlistService,
    private readonly setlistPdf: SetlistPdfService,
    private readonly toast: ToastController,
  ) {
    addIcons({
      add, alertCircleOutline, calendarOutline, downloadOutline, libraryOutline, listOutline,
      musicalNotesOutline, shareSocialOutline,
    });
  }

  ngOnInit(): void { this.load(); }

  load(event?: CustomEvent): void {
    if (!event) this.loading.set(true);
    this.error.set('');
    this.setlistsApi.list().pipe(
      timeout(15000),
      finalize(() => {
        this.loading.set(false);
        event?.detail.complete();
      }),
    ).subscribe({
      next: (setlists) => this.setlists.set([...setlists].sort((left, right) => this.sortDate(right) - this.sortDate(left))),
      error: (error: Error) => this.error.set(error.name === 'TimeoutError'
        ? 'Il server sta impiegando troppo tempo. Riprova tra qualche secondo.'
        : error.message || 'Impossibile caricare le scalette.'),
    });
  }

  songCount(setlist: Setlist): number {
    return setlist.songs?.length ?? setlist.songIds?.length ?? 0;
  }

  setCount(setlist: Setlist): number {
    return setlist.sets?.length ?? setlist.generation?.setCount ?? 0;
  }

  date(setlist: Setlist): string {
    if (!setlist.date) return 'Data da definire';
    const value = new Date(`${setlist.date.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(value.getTime())) return setlist.date;
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(value);
  }

  async downloadPdf(setlist: Setlist, event: Event): Promise<void> {
    this.stopCardNavigation(event);
    this.pdfAction.set(`download-${setlist.id}`);
    try {
      const uri = await this.setlistPdf.download(setlist.id, setlist.title);
      if (uri) await this.showToast('PDF salvato sul dispositivo.', 'success');
    } catch (error) {
      await this.showToast(this.errorMessage(error, 'Impossibile scaricare il PDF.'), 'danger');
    } finally {
      this.pdfAction.set(null);
    }
  }

  async sharePdf(setlist: Setlist, event: Event): Promise<void> {
    this.stopCardNavigation(event);
    this.pdfAction.set(`share-${setlist.id}`);
    try {
      await this.setlistPdf.share(setlist.id, setlist.title);
    } catch (error) {
      await this.showToast(this.errorMessage(error, 'Impossibile condividere il PDF.'), 'danger');
    } finally {
      this.pdfAction.set(null);
    }
  }

  private sortDate(setlist: Setlist): number {
    const timestamp = Date.parse(setlist.date || setlist.updatedAt || setlist.createdAt || '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private stopCardNavigation(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    await (await this.toast.create({ message, duration: 2200, color })).present();
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
