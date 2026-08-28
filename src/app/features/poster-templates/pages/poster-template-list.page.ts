import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, colorPaletteOutline, trashOutline } from 'ionicons/icons';
import { PosterTemplate } from '../models/poster-template.models';
import { PosterTemplateService } from '../services/poster-template.service';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar],
  templateUrl: './poster-template-list.page.html',
})
export class PosterTemplateListPage implements OnInit {
  templates: PosterTemplate[] = [];
  readonly bandId: string;
  constructor(route: ActivatedRoute, private readonly storage: PosterTemplateService) {
    this.bandId = route.snapshot.parent?.parent?.paramMap.get('bandId') ?? route.snapshot.paramMap.get('bandId') ?? '';
    addIcons({ add, colorPaletteOutline, trashOutline });
  }
  ngOnInit(): void { this.refresh(); }
  remove(template: PosterTemplate, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    if (confirm(`Eliminare “${template.name}”?`)) { this.storage.delete(this.bandId, template.id); this.refresh(); }
  }
  private refresh(): void { this.templates = this.storage.list(this.bandId); }
}
