import { ChangeDetectionStrategy } from '@angular/core';
import { DialogService, NativeUiModule } from '../../../shared/ui/native-ui';
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { POSTER_FORMATS, PosterFormatId, PosterTemplate } from '../models/poster-template.models';
import { PosterCanvasComponent } from '../components/poster-canvas.component';
import { PosterTemplateService } from '../services/poster-template.service';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, DatePipe, FormsModule, RouterLink, PosterCanvasComponent, ],
  templateUrl: './poster-template-list.page.html',
  styleUrl: './poster-template-list.page.scss',
})
export class PosterTemplateListPage implements OnInit {
  templates: PosterTemplate[] = [];
  search = '';
  format: PosterFormatId | '' = '';
  readonly formats = POSTER_FORMATS;
  get groups(): PosterTemplate[][] {
    const groups = new Map<string, PosterTemplate[]>();
    for (const template of this.templates) {
      const key = template.groupId ?? template.id;
      groups.set(key, [...(groups.get(key) ?? []), template]);
    }
    return [...groups.values()];
  }
  get filteredGroups(): PosterTemplate[][] {
    const query = this.search.trim().toLocaleLowerCase('it');
    return this.groups.filter(group => group[0].name.toLocaleLowerCase('it').includes(query)
      && (!this.format || group.some(item => item.document.format.id === this.format)));
  }
  preview(group: PosterTemplate[]): PosterTemplate {
    return group.find(item => item.document.format.id === this.format) ?? group[0];
  }
  readonly bandId: string;
  constructor(route: ActivatedRoute, private readonly storage: PosterTemplateService, private readonly dialog: DialogService) {
    this.bandId = route.snapshot.parent?.parent?.paramMap.get('bandId') ?? route.snapshot.paramMap.get('bandId') ?? '';

  }
  ngOnInit(): void { this.refresh();
  }
  async remove(template: PosterTemplate, event: Event): Promise<void> {
    event.preventDefault(); event.stopPropagation();
    const dialog = await this.dialog.create({ header: 'Eliminare il modello?', message: `Eliminare “${template.name}” e tutti i suoi formati?`, buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: () => { this.storage.deleteGroup(this.bandId, template.groupId ?? template.id); this.refresh(); } }] });
    await dialog.present();
  }
  private refresh(): void { this.templates = this.storage.list(this.bandId); }
}
