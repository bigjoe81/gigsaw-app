import { Component } from '@angular/core';
@Component({
  standalone: true,
  template: `<main class="page">
    <p class="eyebrow">KIT BAND</p>
    <h1>Il necessario, dietro le quinte.</h1>
    <p class="lead">I riferimenti della band, nello stesso posto.</p>
    <div class="mode-grid">
      <section class="panel">
        <span class="eyebrow">PRESENTAZIONE</span>
        <h2>Press Kit</h2>
        <p>Biografia, foto e contatti della band.</p>
        <p class="notice">
          Non collegato in questa demo. Il Press Kit reale sarà disponibile con
          l’accesso Gigsaw.
        </p>
      </section>
      <section class="panel">
        <span class="eyebrow">PER IL PALCO</span>
        <h2>Tech Kit</h2>
        <p>Stage plot, channel list e richieste tecniche.</p>
        <p class="notice">
          Non collegato in questa demo. Non sono presenti documenti tecnici
          della tua band.
        </p>
      </section>
    </div>
  </main>`,
})
export class KitsPage {}
