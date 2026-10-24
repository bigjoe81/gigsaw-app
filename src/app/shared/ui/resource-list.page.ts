import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from './native-ui';
import { Component, Injector, OnInit } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ResourceConfig } from '../models/resource-form.models';
import { ActivatedRoute } from '@angular/router';
import { BandResource } from '../../core/models/band-resources.models';
import { GigsawListComponent, GigsawListItemComponent } from './gigsaw';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, RouterLink, GigsawListComponent, GigsawListItemComponent, ],
  templateUrl: './resource-list.page.html',
})
export class ResourceListPage implements OnInit {
  config!: ResourceConfig;
  items: BandResource[] = [];
  loading = true;
  error = '';
  private service!: ResourceConfig['service'] extends infer _ ? any : never;
  constructor(private readonly route: ActivatedRoute, private readonly injector: Injector) {  }
  ngOnInit(): void { this.config = this.route.snapshot.data['resource']; this.service = this.injector.get(this.config.service); this.load(); }
  load(event?: CustomEvent): void { this.loading = !event; this.error = ''; this.service.list().subscribe({ next: (items: BandResource[]) => { this.items = items; this.loading = false; event?.detail.complete(); }, error: (error: Error) => { this.error = error.message || 'Impossibile caricare i dati.'; this.loading = false; event?.detail.complete(); } }); }
  subtitle(item: BandResource): string { const values = item as unknown as Record<string, unknown>; return [values['date'], values['status'], values['album'], values['location'], values['linkGroup'] ? `Link: ${values['linkGroup']}` : ''].filter(Boolean).join(' · ') || 'Apri dettagli'; }
  title(item: BandResource): string { return String((item as unknown as Record<string, unknown>)[this.config.titleKey ?? 'title'] ?? 'Senza titolo'); }
}
