import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, locationOutline, pencilOutline, timeOutline, trashOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { GigService } from '../services/gig.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './gig-detail.page.html',
  styleUrl: './gig-detail.page.scss',
})
export class GigDetailPage implements OnInit {
  readonly gig = signal<Gig | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal('');
  private id!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gigsApi: GigService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
  ) {
    addIcons({ calendarOutline, locationOutline, pencilOutline, timeOutline, trashOutline });
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.gigsApi.get(this.id).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (gig) => this.gig.set(gig),
      error: () => this.error.set('Impossibile caricare il concerto.'),
    });
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.dateValue(value));
  }

  time(value: string): string | null {
    return value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? null;
  }

  venueAddress(gig: Gig): string {
    return [gig.venue?.address, gig.venue?.city].filter(Boolean).join(' · ');
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare il concerto?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.gigsApi.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto eliminato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private dateValue(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
  }
}
