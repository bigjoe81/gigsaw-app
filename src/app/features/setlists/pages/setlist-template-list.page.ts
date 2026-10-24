import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SetlistTemplate } from '../models/setlist.models';
import { SetlistService } from '../services/setlist.service';
import { GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule,
    RouterLink,
    GigsawListComponent,
    GigsawListItemComponent,
    ],
  templateUrl: './setlist-template-list.page.html',
})
export class SetlistTemplateListPage implements OnInit {
  templates: SetlistTemplate[] = [];
  loading = true;
  error = '';

  constructor(private readonly setlistsApi: SetlistService) {

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
