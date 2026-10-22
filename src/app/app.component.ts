import { RouterOutlet } from '@angular/router';
import { NativeUiModule } from './shared/ui/native-ui';
import { Component } from '@angular/core';
import { FaConfig } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [RouterOutlet, NativeUiModule, ],
})
export class AppComponent {
  readonly pageTransitionsEnabled = false;

  constructor(iconConfig: FaConfig) {
    iconConfig.defaultPrefix = 'fal';
  }
}
