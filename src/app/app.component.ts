import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, isPlatform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');

  constructor() {}
}
