import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from './session.service';
import { time } from './recorder.service';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: ` <main class="page stage-page" [class.focus]="focus()">
    <div class="page-heading">
      <div>
        <p class="eyebrow">SUL PALCO · SESSIONE DEMO</p>
        <h1>{{ s.session().band }}</h1>
      </div>
      <button class="secondary" (click)="toggleFocus()">
        {{ focus() ? 'Mostra scaletta' : 'Concentrati' }}
      </button>
    </div>
    <p class="muted stage-info" role="status">
      {{ awake() }} ·
      {{ s.cached() ? 'Scaletta locale' : 'Scaletta demo non salvata' }} ·
      {{ duration() }} totali
    </p>
    <div class="stage-layout">
      <aside class="setlist panel" aria-label="Scaletta">
        <p class="eyebrow">
          LA SERATA · {{ s.session().entries.length }} ELEMENTI
        </p>
        @for (entry of s.session().entries; track entry.id; let i = $index) {
          <button
            class="setlist-row"
            [class.current]="s.position() === i"
            [attr.aria-current]="s.position() === i ? 'step' : null"
            (click)="go(i)"
          >
            <span class="track-number">{{ i + 1 }}</span
            ><span
              ><small
                >{{ entry.section }} ·
                {{
                  entry.type === 'song'
                    ? 'Brano'
                    : entry.type === 'pause'
                      ? 'Pausa'
                      : 'Intermezzo'
                }}</small
              ><strong>{{ entry.title }}</strong></span
            ><span class="muted">{{ time(entry.durationSeconds) }}</span>
          </button>
        }
      </aside>
      <section
        class="reader panel"
        aria-label="Elemento corrente"
        (touchstart)="touchStart($event)"
        (touchend)="touchEnd($event)"
      >
        <div class="reader-top">
          <span class="eyebrow"
            >ORA · {{ s.position() + 1 }} /
            {{ s.session().entries.length }}</span
          >
          <div class="font-controls">
            <button
              aria-label="Riduci testo"
              (click)="font(-2)"
              [disabled]="s.fontSize() <= 18"
            >
              A−</button
            ><button
              aria-label="Ingrandisci testo"
              (click)="font(2)"
              [disabled]="s.fontSize() >= 48"
            >
              A+
            </button>
          </div>
        </div>
        <p class="section-label">{{ current().section }}</p>
        <h2 class="song-title">{{ current().title }}</h2>
        @if (current().song; as song) {
          <div class="song-meta">
            <span>{{ song.key }} <small>TONALITÀ DEMO</small></span
            ><span>{{ song.bpm }} <small>BPM DEMO</small></span
            ><span>{{ s.role() }} <small>LA TUA PARTE</small></span>
          </div>
        }
        <div class="part-content" [style.font-size.px]="s.fontSize()">
          <p>{{ current().notes }}</p>
          @if (s.parts()[current().id]) {
            <pre>{{ s.parts()[current().id] }}</pre>
          } @else {
            <p class="muted">
              Nessun testo o accordo personale. Aggiungilo in “La mia parte”.
            </p>
          }
          @if (s.notes()[current().id]) {
            <div class="personal-note">
              <small>LA TUA NOTA</small>
              <p>{{ s.notes()[current().id] }}</p>
            </div>
          }
        </div>
        <a
          class="text-link"
          routerLink="/materials"
          [queryParams]="{ entry: current().id }"
          >Apri materiali e PDF →</a
        >
        <div class="next-song">
          <span class="eyebrow">{{ next() ? 'DOPO' : 'FINE SCALETTA' }}</span
          ><strong>{{
            next()?.title ?? 'Ultimo elemento della serata'
          }}</strong>
        </div>
        <div class="stage-controls">
          <button
            class="secondary"
            (click)="go(s.position() - 1)"
            [disabled]="s.position() === 0"
          >
            ← Indietro</button
          ><button
            class="primary"
            (click)="go(s.position() + 1)"
            [disabled]="!next()"
          >
            Avanti →
          </button>
        </div>
      </section>
    </div>
    <p class="muted">
      Scorri a destra o sinistra per cambiare elemento. Da tastiera usa le
      frecce. Avanzamento individuale.
    </p>
  </main>`,
})
export class StagePage implements OnDestroy {
  readonly s = inject(SessionService);
  readonly time = time;
  readonly focus = signal(false);
  readonly awake = signal('');
  readonly current = computed(
    () => this.s.session().entries[this.s.position()],
  );
  readonly next = computed<import('@gigsaw/models').LiveEntry | undefined>(
    () => this.s.session().entries[this.s.position() + 1],
  );
  readonly duration = computed(() =>
    time(
      this.s.session().entries.reduce((sum, e) => sum + e.durationSeconds, 0),
    ),
  );
  private wake?: WakeLockSentinel;
  private alive = true;
  private x = 0;
  private y = 0;
  constructor() {
    void this.requestWake();
    document.addEventListener('visibilitychange', this.visibility);
  }
  private visibility = () => {
    if (document.visibilityState === 'visible') void this.requestWake();
  };
  private async requestWake(): Promise<void> {
    if (!('wakeLock' in navigator)) {
      this.awake.set(
        'Schermo acceso: imposta il blocco automatico sul dispositivo',
      );
      return;
    }
    try {
      const wake = await navigator.wakeLock.request('screen');
      if (!this.alive) {
        await wake.release();
        return;
      }
      this.wake = wake;
      this.awake.set('Schermo mantenuto acceso');
      wake.addEventListener('release', () => {
        if (this.alive)
          this.awake.set('Blocco schermo riattivato dal dispositivo');
      });
    } catch {
      this.awake.set(
        'Schermo acceso non disponibile: controlla il blocco automatico',
      );
    }
  }
  go(index: number): void {
    if (index < 0 || index >= this.s.session().entries.length) return;
    this.s.position.set(index);
    void this.s.preferences();
  }
  font(delta: number): void {
    this.s.fontSize.update((n) => Math.max(18, Math.min(48, n + delta)));
    void this.s.preferences();
  }
  toggleFocus(): void {
    this.focus.update((f) => !f);
  }
  @HostListener('document:keydown', ['$event']) key(
    event: KeyboardEvent,
  ): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.go(this.s.position() + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.go(this.s.position() - 1);
    }
  }
  touchStart(event: TouchEvent): void {
    this.x = event.changedTouches[0].clientX;
    this.y = event.changedTouches[0].clientY;
  }
  touchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.x;
    const dy = event.changedTouches[0].clientY - this.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5)
      this.go(this.s.position() + (dx < 0 ? 1 : -1));
  }
  ngOnDestroy(): void {
    this.alive = false;
    document.removeEventListener('visibilitychange', this.visibility);
    void this.wake?.release();
  }
}
