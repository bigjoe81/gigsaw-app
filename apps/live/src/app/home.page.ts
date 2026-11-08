import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from './session.service';
import { IconComponent } from './icon.component';
@Component({
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `<main class="page home">
    <div class="band-selector">
      <live-icon name="people" /><span>{{ s.session().band }}</span
      ><span class="demo-badge">DEMO</span>
    </div>
    <div class="home-greeting">
      <p class="muted">Il tuo spazio, quando suoni.</p>
      <h1>Pronto a suonare?</h1>
    </div>
    <div class="mode-grid">
      <a class="mode-card rehearsal" routerLink="/rehearsal"
        ><live-icon name="mic" />
        <div>
          <h2>Sono in prova</h2>
          <p>Registra, segna i brani, prendi note</p>
        </div>
        <live-icon name="right"
      /></a>
      <a class="mode-card stage" routerLink="/setlist"
        ><live-icon name="stage" />
        <div>
          <h2>Sono sul palco</h2>
          <p>Segui la scaletta, brano per brano</p>
        </div>
        <live-icon name="right"
      /></a>
    </div>
    <section class="panel event-card">
      <live-icon name="calendar" />
      <div>
        <p class="eyebrow">LA TUA SESSIONE DEMO</p>
        <h2>{{ s.session().title }}</h2>
        <p class="muted">{{ s.session().location }}</p>
      </div>
      <a class="button secondary" routerLink="/setlist">Apri scaletta</a>
    </section>
    <section class="offline-panel">
      <div>
        <h2 class="offline-title">
          <live-icon [name]="s.cached() ? 'check' : 'folder'" />{{
            s.cached() ? 'Scaletta salvata qui' : 'Porta la musica con te'
          }}
        </h2>
        <p class="muted">
          {{
            s.cached()
              ? 'Scaletta e note disponibili su questo dispositivo.'
              : 'Salva la scaletta prima di andare sul palco.'
          }}
        </p>
      </div>
      <button
        class="secondary"
        (click)="download()"
        [disabled]="busy || !s.ready()"
      >
        {{
          busy
            ? 'Salvataggio…'
            : s.cached()
              ? 'Aggiorna copia locale'
              : 'Salva scaletta offline'
        }}
      </button>
    </section>
    @if (message) {
      <p role="status" class="notice">{{ message }}</p>
    }
    <aside class="demo-explainer">
      Stai esplorando una sessione demo. Registrazioni, note e PDF vengono
      salvati su questo dispositivo. Accesso e dati della band non sono ancora
      collegati.
    </aside>
  </main>`,
})
export class HomePage {
  readonly s = inject(SessionService);
  busy = false;
  message = '';
  async download(): Promise<void> {
    this.busy = true;
    await this.s.download();
    this.busy = false;
    if (!this.s.error())
      this.message =
        'Copia locale verificata. Per avviare l’app senza rete, aprila almeno una volta dalla build installata.';
  }
}
