import { Component, inject, signal } from '@angular/core';
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
import { ChangelogRelease, ChangelogService } from './core/services/changelog.service';

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
  private readonly changelog = inject(ChangelogService);

  readonly pageTransitionsEnabled = isPlatform('hybrid') || isPlatform('mobileweb');
  readonly changelogOpen = signal(false);
  readonly fullHistoryOpen = signal(false);
  readonly currentRelease = signal<ChangelogRelease | null>(null);
  readonly previousReleases = signal<ChangelogRelease[]>([]);
  readonly archivedReleases = signal<ChangelogRelease[]>([]);

  constructor(iconConfig: FaConfig) {
    iconConfig.defaultPrefix = 'fal';

    this.changelog.changelog$.subscribe({
      next: (document) => {
        const currentIndex = Math.max(0, document.releases.findIndex((release) => release.id === document.current));
        const current = document.releases[currentIndex] ?? document.releases[0] ?? null;
        if (!current) return;

        const history = document.releases.filter((release) => release.id !== current.id);
        this.currentRelease.set(current);
        this.previousReleases.set(history.slice(0, 5));
        this.archivedReleases.set(history.slice(5));

        if (this.changelog.hasUnread(current.id)) {
          queueMicrotask(() => this.changelogOpen.set(true));
        }
      },
    });
  }

  toggleFullHistory(): void {
    this.fullHistoryOpen.update((open) => !open);
  }

  closeChangelog(): void {
    const current = this.currentRelease();
    if (current) this.changelog.markAsRead(current.id);
    this.fullHistoryOpen.set(false);
    this.changelogOpen.set(false);
  }
}
