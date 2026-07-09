import { Component, Injector, OnInit } from '@angular/core';

import { RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonRefresher, IonRefresherContent, IonSkeletonText, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, musicalNotes } from 'ionicons/icons';
import { ResourceConfig } from '../models/resource-form.models';
import { ActivatedRoute } from '@angular/router';
import { BandResource } from '../../core/models/band-resources.models';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonRefresher, IonRefresherContent, IonSkeletonText, IonText, IonTitle, IonToolbar],
  templateUrl: './resource-list.page.html',
  styles: ['.state{min-height:55%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}.state ion-icon{font-size:44px;color:var(--ion-color-medium)}'],
})
export class ResourceListPage implements OnInit {
  config!: ResourceConfig;
  items: BandResource[] = [];
  loading = true;
  error = '';
  private service!: ResourceConfig['service'] extends infer _ ? any : never;
  constructor(private readonly route: ActivatedRoute, private readonly injector: Injector) { addIcons({ add, alertCircle, musicalNotes }); }
  ngOnInit(): void { this.config = this.route.snapshot.data['resource']; this.service = this.injector.get(this.config.service); this.load(); }
  load(event?: CustomEvent): void { this.loading = !event; this.error = ''; this.service.list().subscribe({ next: (items: BandResource[]) => { this.items = items; this.loading = false; event?.detail.complete(); }, error: (error: Error) => { this.error = error.message || 'Impossibile caricare i dati.'; this.loading = false; event?.detail.complete(); } }); }
  subtitle(item: BandResource): string { const values = item as unknown as Record<string, unknown>; return [values['date'], values['status'], values['album'], values['location'], values['linkGroup'] ? `Link: ${values['linkGroup']}` : ''].filter(Boolean).join(' · ') || 'Apri dettagli'; }
  title(item: BandResource): string { return String((item as unknown as Record<string, unknown>)[this.config.titleKey ?? 'title'] ?? 'Senza titolo'); }
}
