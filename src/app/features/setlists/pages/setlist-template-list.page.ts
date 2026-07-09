
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, library } from 'ionicons/icons';
import { SetlistTemplate } from '../models/setlist.models';
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
  templateUrl: './setlist-template-list.page.html',
  styles: ['.state{min-height:55%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}.state ion-icon{font-size:44px;color:var(--ion-color-medium)}'],
})
export class SetlistTemplateListPage implements OnInit {
  templates: SetlistTemplate[] = [];
  loading = true;
  error = '';

  constructor(private readonly setlistsApi: SetlistService) {
    addIcons({ add, alertCircle, library });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.loading = !event;
    this.error = '';
    this.setlistsApi.listTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loading = false;
        event?.detail.complete();
      },
      error: (error: Error) => {
        this.error = error.message || 'Impossibile caricare i template.';
        this.loading = false;
        event?.detail.complete();
      },
    });
  }

  subtitle(template: SetlistTemplate): string {
    return [
      template.targetSongCount ? `${template.targetSongCount} brani` : '',
      template.setCount ? `${template.setCount} set` : '',
      template.totalShowDurationSeconds ? `${Math.floor(template.totalShowDurationSeconds / 60)} min` : '',
    ].filter(Boolean).join(' · ') || 'Apri dettagli';
  }
}
