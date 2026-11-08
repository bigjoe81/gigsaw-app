import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { SessionService } from './session.service';
import { time } from './recorder.service';
@Component({
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `<main
    class="page stage-page"
    [class.focus]="focus()"
    [class.setlist-overview]="overview"
  >
    <div class="page-heading stage-heading">
      <div>
        <a class="back-link" routerLink="/"
          ><live-icon name="left" /> Sul palco</a
        >
        <p class="muted small">{{ s.session().band }}</p>
      </div>
      @if (!overview) {
        <div class="reader-actions">
          <a class="button secondary" routerLink="/setlist">Scaletta</a
          ><button class="secondary focus-toggle" (click)="toggleFocus()">
            {{ focus() ? 'Mostra scaletta' : 'Concentrati' }}
          </button>
        </div>
      }
    </div>
    @if (overview) {
      <h1 class="show-title">{{ s.session().title }}</h1>
      <p class="muted">{{ s.session().location }}</p>
    }
    <p class="stage-info" role="status">
      <span class="pill" [class.saved]="s.cached()">{{
        s.cached() ? '✓ Offline pronto' : 'Demo · non salvata'
      }}</span
      ><span class="pill">{{ current().section }}</span
      ><span class="muted"
        >{{ s.session().entries.length }} elementi ·
        {{ duration() }} totali</span
      >
    </p>
    <div class="stage-layout">
      <aside class="setlist panel" aria-label="Scaletta">
        @if (!overview) {
          <h2>{{ s.session().title }}</h2>
          <p class="eyebrow">
            {{ current().section }} · {{ s.position() + 1 }} /
            {{ s.session().entries.length }}
          </p>
        }
        @for (entry of s.session().entries; track entry.id; let i = $index) {
          <button
            class="setlist-row"
            [class.current]="s.position() === i"
            [class.pause-row]="entry.type === 'pause'"
            [attr.aria-current]="s.position() === i ? 'step' : null"
            (click)="go(i)"
          >
            <span class="track-number">{{
              (i + 1).toString().padStart(2, '0')
            }}</span
            ><span class="track-detail"
              ><strong>{{ entry.title }}</strong
              ><small
                >{{ entry.section }}
                @if (entry.song; as song) {
                  · {{ song.bpm }} BPM · {{ song.key }}
                } @else {
                  · {{ entry.type === 'pause' ? 'Pausa' : 'Intermezzo' }}
                }
              </small></span
            ><span class="track-duration">{{
              time(entry.durationSeconds)
            }}</span>
          </button>
        }
        @if (overview) {
          <a class="button primary open-stage" routerLink="/stage"
            ><live-icon name="stage" />Apri modalità palco</a
          >
        }
      </aside>
      @if (!overview) {
        <section
          class="reader panel"
          aria-label="Elemento corrente"
          (touchstart)="touchStart($event)"
          (touchend)="touchEnd($event)"
        >
          <div class="reader-top">
            <span class="eyebrow"
              >{{ s.position() + 1 }} / {{ s.session().entries.length }} ·
              {{ current().section }}</span
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
                A+</button
              ><a
                class="icon-button"
                routerLink="/setlist"
                aria-label="Esci dalla modalità palco"
                ><live-icon name="close"
              /></a>
            </div>
          </div>
          <h2 class="song-title">{{ current().title }}</h2>
          @if (current().song; as song) {
            <div class="song-meta">
              <span>♩ {{ song.bpm }} BPM</span
              ><span>Tonalità {{ song.key }}</span
              ><span>{{ s.role() }}</span>
            </div>
          }
          <p class="muted small">Dati musicali di esempio</p>
          <div
            class="reader-tabs"
            role="tablist"
            aria-label="Materiale del brano"
            (keydown)="tabKey($event)"
          >
            <button
              role="tab"
              id="part-tab"
              [attr.aria-selected]="tab() === 'part'"
              [tabIndex]="tab() === 'part' ? 0 : -1"
              aria-controls="song-content"
              (click)="tab.set('part')"
            >
              Testo e accordi</button
            ><button
              role="tab"
              id="notes-tab"
              [attr.aria-selected]="tab() === 'notes'"
              [tabIndex]="tab() === 'notes' ? 0 : -1"
              aria-controls="song-content"
              (click)="tab.set('notes')"
            >
              Note
            </button>
          </div>
          <div
            class="part-content"
            id="song-content"
            role="tabpanel"
            [attr.aria-labelledby]="tab() === 'part' ? 'part-tab' : 'notes-tab'"
            [style.font-size.px]="s.fontSize()"
          >
            @if (tab() === 'part') {
              @if (s.parts()[current().id]) {
                <pre>{{ s.parts()[current().id] }}</pre>
              } @else {
                <div class="reader-empty">
                  <live-icon name="file" />
                  <p>Nessun testo o accordo personale.</p>
                  <a
                    class="text-link"
                    routerLink="/materials"
                    [queryParams]="{ entry: current().id }"
                    >Aggiungi la tua parte →</a
                  >
                </div>
              }
            } @else {
              <div class="cue-card">
                <small>INDICAZIONI DEL BRANO</small>
                <p>{{ current().notes }}</p>
              </div>
              @if (s.notes()[current().id]) {
                <div class="personal-note">
                  <small>LA TUA NOTA</small>
                  <p>{{ s.notes()[current().id] }}</p>
                </div>
              }
            }
          </div>
          <a
            class="text-link materials-link"
            routerLink="/materials"
            [queryParams]="{ entry: current().id }"
            ><live-icon name="folder" /> Apri materiali e PDF</a
          >
          <div class="stage-footer">
            <div class="next-song">
              <span class="eyebrow">{{
                next() ? 'DOPO' : 'FINE SCALETTA'
              }}</span
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
                <live-icon name="left" />Precedente</button
              ><button
                class="primary"
                (click)="go(s.position() + 1)"
                [disabled]="!next()"
              >
                Prossimo<live-icon name="right" />
              </button>
            </div>
          </div>
        </section>
        <aside class="stage-notes panel">
          <p class="eyebrow">NOTE DEL BRANO</p>
          <div class="cue-card">
            <live-icon name="note" />
            <p>{{ current().notes }}</p>
          </div>
          @if (s.notes()[current().id]) {
            <div class="personal-note">
              <small>LA TUA NOTA</small>
              <p>{{ s.notes()[current().id] }}</p>
            </div>
          }
          <h3>Materiali</h3>
          <a
            class="document-link"
            routerLink="/materials"
            [queryParams]="{ entry: current().id }"
            ><live-icon name="file" />Testo e accordi</a
          >
          @for (doc of documents(); track doc.id) {
            <a
              class="document-link"
              routerLink="/materials"
              [queryParams]="{ entry: current().id }"
              ><live-icon name="file" />{{ doc.name }}</a
            >
          }
        </aside>
      }
    </div>
    @if (!overview) {
      <p class="muted small stage-help">
        Swipe o frecce per cambiare brano · Avanzamento individuale<br />{{
          awake()
        }}
      </p>
    }
  </main>`,
})
export class StagePage implements OnDestroy {
  readonly s = inject(SessionService);
  readonly time = time;
  readonly overview =
    inject(ActivatedRoute).snapshot.routeConfig?.path === 'setlist';
  readonly tab = signal<'part' | 'notes'>('notes');
  readonly documents = computed(() =>
    this.s.documents().filter((doc) => doc.entryId === this.current().id),
  );
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
    if (!this.overview) void this.requestWake();
    document.addEventListener('visibilitychange', this.visibility);
  }
  private visibility = () => {
    if (!this.overview && document.visibilityState === 'visible')
      void this.requestWake();
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
    document.querySelector('.part-content')?.scrollTo(0, 0);
    void this.s.preferences();
  }
  font(delta: number): void {
    this.s.fontSize.update((n) => Math.max(18, Math.min(48, n + delta)));
    void this.s.preferences();
  }
  toggleFocus(): void {
    this.focus.update((f) => !f);
  }
  tabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const next =
      event.key === 'Home'
        ? 'part'
        : event.key === 'End'
          ? 'notes'
          : this.tab() === 'part'
            ? 'notes'
            : 'part';
    this.tab.set(next);
    document
      .getElementById(next === 'part' ? 'part-tab' : 'notes-tab')
      ?.focus();
  }
  @HostListener('document:keydown', ['$event']) key(
    event: KeyboardEvent,
  ): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
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
