import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from './session.service';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: ` <main class="page home">
    <p class="eyebrow">IL TUO SPAZIO, QUANDO SUONI</p>
    <h1>Ci siamo.<br />Si suona.</h1>
    <p class="lead">La prova e il palco, a portata di mano.</p>
    <section class="session-card">
      <div>
        <span class="eyebrow">BAND DEMO</span>
        <h2>{{ s.session().band }}</h2>
        <p>{{ s.session().title }}</p>
      </div>
      <span class="band-symbol" aria-hidden="true">CBT</span>
    </section>
    <div class="mode-grid">
      <a class="mode-card rehearsal" routerLink="/rehearsal"
        ><span class="mode-icon" aria-hidden="true">●</span>
        <p class="eyebrow">CATTURA LE IDEE</p>
        <h2>Sono in prova</h2>
        <p>Registra, segna i brani, ritrova le take.</p>
        <span class="mode-action"
          >Inizia la prova <span aria-hidden="true">↗</span></span
        ></a
      >
      <a class="mode-card stage" routerLink="/stage"
        ><span class="mode-icon" aria-hidden="true">↗</span>
        <p class="eyebrow">CONCENTRATI SULLA MUSICA</p>
        <h2>Sono sul palco</h2>
        <p>La scaletta, la tua parte, il prossimo brano.</p>
        <span class="mode-action"
          >Apri il concerto <span aria-hidden="true">↗</span></span
        ></a
      >
    </div>
    <section class="panel offline-panel">
      <div>
        <h2>
          {{
            s.cached() ? 'Scaletta salvata qui' : 'Preparati prima di partire'
          }}
        </h2>
        <p>
          {{
            s.cached()
              ? 'Scaletta demo e note disponibili su questo dispositivo.'
              : 'Salva la scaletta demo per ritrovarla anche senza rete.'
          }}
        </p>
        <p class="muted">
          I PDF importati e le take sono locali. Nessuna sincronizzazione con la
          band.
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
      Stai esplorando una sessione demo. Registrazioni, note e PDF che aggiungi
      vengono salvati davvero su questo dispositivo. Accesso Gigsaw e dati della
      tua band saranno collegati in una fase successiva.
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
