import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, isPlatform } from '@ionic/angular/standalone';
import { FaConfig } from '@fortawesome/angular-fontawesome';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');
  readonly isStaging = environment.staging;

  constructor(iconConfig: FaConfig) {
    iconConfig.defaultPrefix = 'fal';
  }
}
