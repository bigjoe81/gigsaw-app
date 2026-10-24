import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NativeUiModule } from './shared/ui/native-ui';
import { FaConfig } from '@fortawesome/angular-fontawesome';
import { AuthService } from './core/auth/auth.service';
import { UpcomingRehearsalPromptService } from './features/auth/upcoming-rehearsal-prompt.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [RouterOutlet, NativeUiModule, ],
})
export class AppComponent implements OnInit {
  readonly pageTransitionsEnabled = false;

  constructor(
    iconConfig: FaConfig,
    private readonly auth: AuthService,
    private readonly upcomingRehearsals: UpcomingRehearsalPromptService,
  ) {
    iconConfig.defaultPrefix = 'fas';
  }

  ngOnInit(): void {
    this.auth.restoreSession().subscribe((user) => {
      if (user) this.upcomingRehearsals.checkForUpcomingRehearsals();
    });
  }
}
