import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { IconComponent } from './icon.component';
import { IonApp } from '@ionic/angular';
import { SessionService } from './session.service';
import { RecorderService, time } from './recorder.service';
@Component({
  selector: 'live-root',
  standalone: true,
  imports: [IonApp, RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  template: ` <ion-app [class.stage-shell]="isStage()">
    <header class="app-header">
      <a class="brand" routerLink="/" aria-label="Gigsaw Live, inizio"
        >gigsaw<span>LIVE</span></a
      >
      <div class="header-status">
        <span class="demo-badge">DEMO</span
        ><span>{{ session.online() ? 'Online' : 'Senza rete' }}</span>
      </div>
    </header>
    @if (recorder.active()) {
      <a class="recording-banner" routerLink="/rehearsal"
        ><span class="rec-dot"></span> Registrazione in corso ·
        {{ time(recorder.elapsed()) }} · Apri prova</a
      >
    }
    @if (session.error()) {
      <p class="notice error" role="alert">{{ session.error() }}</p>
    }
    <div class="app-body"><router-outlet /></div>
    <nav class="bottom-nav" aria-label="Navigazione principale">
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ><live-icon name="home" /><span>Spazio</span></a
      >
      <a routerLink="/materials" routerLinkActive="active"
        ><live-icon name="folder" /><span>Materiali</span></a
      >
      <a routerLink="/kits" routerLinkActive="active"
        ><live-icon name="kit" /><span>Kit band</span></a
      >
    </nav>
  </ion-app>`,
})
export class AppComponent {
  readonly session = inject(SessionService);
  readonly recorder = inject(RecorderService);
  readonly time = time;
  readonly isStage = signal(false);
  private readonly router = inject(Router);
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.isStage.set(event.urlAfterRedirects.split('?')[0] === '/stage');
    });
    window.addEventListener('beforeunload', (event) => {
      if (
        this.recorder.active() ||
        this.recorder.busy() ||
        this.recorder.emergencyBlob()
      ) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }
}
