import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular';
import { SessionService } from './session.service';
import { RecorderService, time } from './recorder.service';
@Component({
  selector: 'live-root',
  standalone: true,
  imports: [IonApp, RouterLink, RouterOutlet],
  template: ` <ion-app>
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
      <a routerLink="/">Sessione</a><a routerLink="/materials">La mia parte</a
      ><a routerLink="/kits">Kit band</a>
    </nav>
  </ion-app>`,
})
export class AppComponent {
  readonly session = inject(SessionService);
  readonly recorder = inject(RecorderService);
  readonly time = time;
  constructor() {
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
