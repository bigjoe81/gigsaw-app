
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { SetlistTemplate } from '../models/setlist.models';
import { SetlistService } from '../services/setlist.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './setlist-template-detail.page.html',
})
export class SetlistTemplateDetailPage implements OnInit {
  template?: SetlistTemplate;
  loading = true;
  private id!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly setlistsApi: SetlistService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('templateId'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.setlistsApi.getTemplate(this.id).subscribe({
      next: (template) => {
        this.template = template;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  formatSeconds(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare template?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.setlistsApi.deleteTemplate(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Template eliminato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }
}
