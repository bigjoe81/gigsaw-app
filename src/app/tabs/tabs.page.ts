import { Component, EnvironmentInjector, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { listOutline, micOutline, musicalNotesOutline, peopleOutline, radioOutline } from 'ionicons/icons';
import { BandContextService } from '../core/services/band-context.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);

  constructor() {
    addIcons({ listOutline, micOutline, musicalNotesOutline, peopleOutline, radioOutline });
  }

  tabHref(section: 'repertorio' | 'prove' | 'concerti' | 'scalette' | 'band'): string {
    const bandId = this.route.snapshot.paramMap.get('bandId') ?? this.bandContext.getCurrentBand();
    return bandId ? `/band/${bandId}/${section}` : '/bands';
  }
}
