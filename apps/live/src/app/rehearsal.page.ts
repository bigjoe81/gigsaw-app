import { downloadBlob } from './device-files';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from './session.service';
import { RecorderService, time } from './recorder.service';
import type { LiveTake } from '@gigsaw/models';
@Component({
  standalone: true,
  imports: [FormsModule],
  template: ` <main class="page">
    <p class="eyebrow">IN PROVA · SESSIONE DEMO</p>
    <h1>Ogni idea, al suo posto.</h1>
    <p class="lead">{{ s.session().band }}</p>
    <div class="rehearsal-layout">
      <section class="panel recorder">
        <span class="eyebrow">{{
          r.active() ? 'STAI REGISTRANDO' : 'PRONTO QUANDO VUOI'
        }}</span>
        <div class="timer" aria-live="off">{{ time(r.elapsed()) }}</div>
        <label for="rehearsal-song">Brano su cui state lavorando</label
        ><select
          id="rehearsal-song"
          [(ngModel)]="entryId"
          [disabled]="r.busy()"
        >
          @for (entry of songs; track entry.id) {
            <option [value]="entry.id">{{ entry.title }}</option>
          }
        </select>
        <p class="muted">
          {{
            r.active()
              ? 'Se cambi brano, premi “Nuovo brano” per aggiungere un marker.'
              : 'Il microfono verrà richiesto quando premi REC.'
          }}
        </p>
        <div class="record-controls">
          @if (r.active()) {
            <button class="danger" (click)="r.stop()" [disabled]="r.busy()">
              ■ STOP e salva</button
            ><button class="secondary" (click)="mark()" [disabled]="r.busy()">
              ＋ Nuovo brano
            </button>
          } @else {
            <button
              class="primary rec-button"
              (click)="start()"
              [disabled]="r.busy() || !r.ready() || !!r.emergencyBlob()"
            >
              ● {{ r.busy() ? 'Attendi…' : 'REC · Registra' }}
            </button>
          }
        </div>
        @if (r.active(); as take) {
          <ol class="markers">
            @for (marker of take.markers; track $index) {
              <li>
                <span>{{ time(marker.seconds) }}</span> {{ marker.title }}
              </li>
            }
          </ol>
        }
        @if (r.error()) {
          <p class="notice error" role="alert">{{ r.error() }}</p>
        }
        @if (r.emergencyBlob()) {
          <button class="danger" (click)="emergency()">
            Scarica audio di emergenza
          </button>
        }
        <p class="muted small">
          Audio locale, nessun upload. Mantieni l’app in primo piano durante la
          registrazione. Un’interruzione può lasciare una take parziale
          recuperabile.
        </p>
      </section>
      <section class="panel">
        <p class="eyebrow">DA RICORDARE</p>
        <h2>Una nota per il prossimo giro</h2>
        <label for="rehearsal-note">{{ selected.title }}</label
        ><textarea
          id="rehearsal-note"
          rows="6"
          [ngModel]="draftFor(entryId)"
          (ngModelChange)="drafts[entryId] = $event"
          placeholder="Attacco, finale, qualcosa da riprovare…"
        ></textarea
        ><button class="secondary" (click)="saveNote()" [disabled]="saving">
          {{ saving ? 'Salvataggio…' : 'Salva nota' }}
        </button>
        @if (message) {
          <p role="status">{{ message }}</p>
        }
        <p class="muted">La ritrovi anche sul palco, accanto al brano.</p>
      </section>
    </div>
    <section class="take-section">
      <div class="page-heading">
        <div>
          <p class="eyebrow">LA MEMORIA DELLA PROVA</p>
          <h2>Le tue take</h2>
        </div>
        <span class="pill">Solo su questo dispositivo</span>
      </div>
      @if (!r.takes().length) {
        <div class="empty-state">
          Ancora nessuna take. La prima idea parte da REC.
        </div>
      }
      @for (take of r.takes(); track take.id) {
        <article class="panel take">
          <div>
            <p class="eyebrow">
              {{ date(take.startedAt) }} · {{ time(take.duration) }}
            </p>
            <h3>{{ take.title }}</h3>
            <p>
              {{
                take.status === 'interrupted'
                  ? 'Take recuperata dopo un’interruzione: audio potenzialmente parziale.'
                  : 'Salvata sul dispositivo'
              }}
            </p>
          </div>
          <div class="take-actions">
            <button class="secondary" (click)="play(take)">Riascolta</button
            ><button class="secondary" (click)="export(take)">Scarica</button
            ><button class="text-button" (click)="deleteId = take.id">
              Elimina
            </button>
          </div>
          @if (deleteId === take.id) {
            <div class="notice">
              <p>Eliminare definitivamente questa take dal dispositivo?</p>
              <button class="danger" (click)="remove(take.id)">
                Elimina take
              </button>
              <button class="secondary" (click)="deleteId = ''">Annulla</button>
            </div>
          }
          @if (playingId === take.id) {
            <audio controls [src]="audioUrl" #audio></audio>
            <div class="marker-links">
              @for (marker of take.markers; track $index) {
                <button
                  class="text-button"
                  (click)="audio.currentTime = marker.seconds; audio.play()"
                >
                  {{ time(marker.seconds) }} · {{ marker.title }}
                </button>
              }
            </div>
          }
        </article>
      }
      @if (playError) {
        <p class="notice error" role="alert">{{ playError }}</p>
      }
    </section>
  </main>`,
})
export class RehearsalPage implements OnDestroy {
  readonly s = inject(SessionService);
  readonly r = inject(RecorderService);
  readonly time = time;
  readonly songs = this.s.session().entries.filter((e) => e.type === 'song');
  entryId = this.songs[0].id;
  drafts: Record<string, string> = {};
  message = '';
  saving = false;
  deleteId = '';
  playingId = '';
  audioUrl = '';
  playError = '';
  get selected() {
    return this.songs.find((e) => e.id === this.entryId)!;
  }
  draftFor(id: string): string {
    return this.drafts[id] ?? this.s.notes()[id] ?? '';
  }
  start(): void {
    void this.r.start(this.s.session().id, this.selected);
  }
  mark(): void {
    this.r.marker(this.selected);
  }
  async saveNote(): Promise<void> {
    this.saving = true;
    this.message = '';
    const id = this.entryId;
    const ok = await this.s.saveText('notes', id, this.draftFor(id));
    if (ok) this.message = 'Nota salvata sul dispositivo.';
    this.saving = false;
  }
  date(value: string): string {
    return new Date(value).toLocaleString('it-IT');
  }
  async play(take: LiveTake): Promise<void> {
    try {
      const blob = await this.r.audio(take.id);
      if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = URL.createObjectURL(blob);
      this.playingId = take.id;
      this.playError = '';
    } catch (error) {
      this.playError = (error as Error).message;
    }
  }
  async export(take: LiveTake): Promise<void> {
    try {
      await downloadBlob(
        await this.r.audio(take.id),
        `gigsaw-${take.id}.${take.mimeType.includes('mp4') ? 'm4a' : 'webm'}`,
      );
    } catch (error) {
      this.playError = (error as Error).message;
    }
  }
  async emergency(): Promise<void> {
    const blob = this.r.emergencyBlob();
    if (!blob) return;
    try {
      await downloadBlob(
        blob,
        `gigsaw-emergenza.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`,
      );
    } catch {
      this.playError =
        'Esportazione non riuscita. Mantieni aperta la pagina e riprova.';
    }
  }
  async remove(id: string): Promise<void> {
    try {
      await this.r.remove(id);
      this.deleteId = '';
      if (this.playingId === id) {
        URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = '';
        this.playingId = '';
      }
    } catch {
      this.playError = 'Eliminazione non riuscita. Riprova.';
    }
  }
  ngOnDestroy(): void {
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
  }
}
