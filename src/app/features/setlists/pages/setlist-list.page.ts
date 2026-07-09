
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, musicalNotes } from 'ionicons/icons';
import { Setlist } from '../../../core/models/band-resources.models';
import { SetlistPdfService } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonText,
    IonTitle,
    IonToolbar
],
  templateUrl: './setlist-list.page.html',
})
export class SetlistListPage implements OnInit {
  setlists: Setlist[] = [];
  loading = true;
  error = '';

  constructor(
    private readonly setlistsApi: SetlistService,
    private readonly setlistPdf: SetlistPdfService,
    private readonly toast: ToastController,
  ) {
    addIcons({ add, alertCircle, musicalNotes });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.loading = !event;
    this.error = '';
    this.setlistsApi.list().subscribe({
      next: (setlists) => {
        this.setlists = setlists;
        this.loading = false;
        event?.detail.complete();
      },
      error: (error: Error) => {
        this.error = error.message || 'Impossibile caricare le setlist.';
        this.loading = false;
        event?.detail.complete();
      },
    });
  }

  subtitle(setlist: Setlist): string {
    const parts = [
      setlist.date,
      setlist.songs?.length ? `${setlist.songs.length} brani` : setlist.songIds?.length ? `${setlist.songIds.length} brani` : '',
      setlist.sets?.length ? `${setlist.sets.length} set` : '',
      setlist.gigId ? `Gig #${setlist.gigId}` : '',
    ].filter(Boolean);

    return parts.join(' · ') || 'Apri dettagli';
  }

  async downloadPdf(setlist: Setlist, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    try {
      const uri = await this.setlistPdf.download(setlist.id, setlist.title);
      if (uri) {
        (await this.toast.create({
          message: 'PDF salvato sul dispositivo.',
          duration: 2200,
          color: 'success',
        })).present();
      }
    } catch (error) {
      (await this.toast.create({
        message: this.errorMessage(error, 'Impossibile scaricare il PDF.'),
        duration: 2200,
        color: 'danger',
      })).present();
    }
  }

  async sharePdf(setlist: Setlist, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    try {
      await this.setlistPdf.share(setlist.id, setlist.title);
    } catch (error) {
      (await this.toast.create({
        message: this.errorMessage(error, 'Impossibile condividere il PDF.'),
        duration: 2200,
        color: 'danger',
      })).present();
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
