import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, colorPaletteOutline, trashOutline, searchOutline, arrowForwardOutline } from 'ionicons/icons';
import { POSTER_FORMATS, PosterFormatId, PosterTemplate } from '../models/poster-template.models';
import { PosterCanvasComponent } from '../components/poster-canvas.component';
import { PosterTemplateService } from '../services/poster-template.service';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, PosterCanvasComponent, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar],
  templateUrl: './poster-template-list.page.html',
  styleUrl: './poster-template-list.page.scss',
})
export class PosterTemplateListPage implements OnInit {
  templates: PosterTemplate[] = [];
  search = '';
  format: PosterFormatId | '' = '';
  readonly formats = POSTER_FORMATS;
  get filteredTemplates(): PosterTemplate[] {
    const query = this.search.trim().toLocaleLowerCase('it');
    return this.templates.filter(template => (!this.format || template.document.format.id === this.format)
      && template.name.toLocaleLowerCase('it').includes(query));
  }
  readonly bandId: string;
  constructor(route: ActivatedRoute, private readonly storage: PosterTemplateService) {
    this.bandId = route.snapshot.parent?.parent?.paramMap.get('bandId') ?? route.snapshot.paramMap.get('bandId') ?? '';
    addIcons({ add, colorPaletteOutline, trashOutline, searchOutline, arrowForwardOutline });
  }
  ngOnInit(): void { this.refresh(); }
  ionViewWillEnter(): void { this.refresh(); }
  remove(template: PosterTemplate, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    if (confirm(`Eliminare “${template.name}”?`)) { this.storage.delete(this.bandId, template.id); this.refresh(); }
  }
  private refresh(): void { this.templates = this.storage.list(this.bandId); }
}
