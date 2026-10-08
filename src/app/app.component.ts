import { Component, signal } from '@angular/core';
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/angular/standalone';
import { FaConfig } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonApp,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonModal,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
  ],
})
export class AppComponent {
  private static readonly changelogReleaseId = '2026-10-08-band-flows';
  private static readonly changelogStorageKey = 'gigsaw:last-seen-changelog';

  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');
  readonly changelogOpen = signal(false);
  readonly fullHistoryOpen = signal(false);

  constructor(iconConfig: FaConfig) {
    iconConfig.defaultPrefix = 'fal';

    const lastSeenRelease = localStorage.getItem(AppComponent.changelogStorageKey);
    if (lastSeenRelease !== AppComponent.changelogReleaseId) {
      queueMicrotask(() => this.changelogOpen.set(true));
    }
  }

  toggleFullHistory(): void {
    this.fullHistoryOpen.update((open) => !open);
  }

  closeChangelog(): void {
    localStorage.setItem(AppComponent.changelogStorageKey, AppComponent.changelogReleaseId);
    this.fullHistoryOpen.set(false);
    this.changelogOpen.set(false);
  }
}
