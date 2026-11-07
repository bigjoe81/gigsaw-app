import { Capacitor } from '@capacitor/core';
import { Injectable, signal } from '@angular/core';
import type { LiveEntry, LiveTake } from '@gigsaw/models';
import { LocalStore } from './local-store';

@Injectable({ providedIn: 'root' })
export class RecorderService {
  readonly active = signal<LiveTake | null>(null);
  readonly takes = signal<LiveTake[]>([]);
  readonly elapsed = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly ready = signal(false);
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setInterval>;
  private started = 0;
  private sequence = 0;
  private writes: Promise<void> = Promise.resolve();
  // Retain bytes until commit, so a quota error still permits an explicit download.
  private memory: Blob[] = [];
  private failed = false;
  private emergency?: Blob;
  constructor(private readonly store: LocalStore) {
    if (Capacitor.isNativePlatform()) {
      void import('@capacitor/app').then(({ App }) =>
        App.addListener('appStateChange', (state) => {
          if (!state.isActive && this.active()) {
            this.error.set(
              'App passata in secondo piano: registrazione fermata e salvata come take parziale.',
            );
            void this.stop(true);
          }
        }),
      );
    }
    if (navigator.locks) {
      void navigator.locks.request(
        'gigsaw-live-recorder',
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            this.error.set(
              'Gigsaw Live è già aperto in un’altra finestra. Chiudila e riapri questa pagina.',
            );
            return;
          }
          await this.restore();
          // Hold ownership until the document closes; other tabs must never recover an active take.
          await new Promise<void>(() => undefined);
        },
      );
    } else {
      void this.restore();
    }
  }
  private async restore(): Promise<void> {
    try {
      const rows = await this.store.entries<LiveTake>('take:');
      const takes = rows.map((row) => row.value);
      for (const take of takes.filter((t) => t.status === 'recording')) {
        take.status = 'interrupted';
        const chunks = await this.store.entries<Blob>(`chunk:${take.id}:`);
        // Duration comes from the most recent committed checkpoint, not wall clock downtime.
        if (chunks.length)
          await this.store.write(
            [
              {
                key: `audio:${take.id}`,
                value: new Blob(
                  chunks.map((c) => c.value),
                  { type: take.mimeType },
                ),
              },
              { key: `take:${take.id}`, value: take },
            ],
            chunks.map((c) => c.key),
          );
        else await this.store.write([{ key: `take:${take.id}`, value: take }]);
      }
      this.takes.set(
        takes.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      );
    } catch {
      this.error.set(
        'Impossibile leggere le registrazioni locali. Riprova dopo aver liberato spazio.',
      );
    } finally {
      this.ready.set(true);
    }
  }
  async start(sessionId: string, entry: LiveEntry): Promise<void> {
    if (this.active() || this.busy() || !this.ready() || this.emergency) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      this.error.set(
        'Registrazione non supportata. Usa HTTPS e un browser compatibile.',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      this.recorder = new MediaRecorder(
        this.stream,
        mimeType ? { mimeType } : undefined,
      );
      const take: LiveTake = {
        id: crypto.randomUUID(),
        sessionId,
        title: entry.title,
        startedAt: new Date().toISOString(),
        duration: 0,
        mimeType: this.recorder.mimeType,
        status: 'recording',
        markers: [{ entryId: entry.id, title: entry.title, seconds: 0 }],
      };
      await this.store.write([{ key: `take:${take.id}`, value: take }]);
      this.memory = [];
      this.emergency = undefined;
      this.failed = false;
      this.sequence = 0;
      this.writes = Promise.resolve();
      this.recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        this.memory.push(event.data);
        const key = `chunk:${take.id}:${String(this.sequence++).padStart(8, '0')}`;
        const checkpoint = { ...this.active()!, duration: this.seconds() };
        this.writes = this.writes
          .then(async () => {
            if (this.failed) return;
            await this.store.write([
              { key, value: event.data },
              { key: `take:${take.id}`, value: checkpoint },
            ]);
          })
          .catch(() => {
            this.failed = true;
            this.error.set(
              'Spazio insufficiente: registrazione fermata. Scarica subito l’audio di emergenza.',
            );
            void this.stop();
          });
      };
      this.recorder.onerror = () => {
        this.error.set(
          'Registrazione interrotta dal dispositivo. Recupero dell’audio disponibile.',
        );
        void this.stop(true);
      };
      this.stream.getAudioTracks()[0].onended = () => {
        if (this.active()) void this.stop(true);
      };
      this.started = Date.now();
      this.elapsed.set(0);
      this.active.set(take);
      this.recorder.start(1000);
      this.timer = setInterval(() => this.elapsed.set(this.seconds()), 250);
    } catch (error) {
      this.active.set(null);
      this.cleanup();
      this.error.set(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microfono non autorizzato. Consenti l’accesso nelle impostazioni e riprova.'
          : 'Registrazione non avviata. Controlla microfono e spazio disponibile.',
      );
    } finally {
      this.busy.set(false);
    }
  }
  private seconds(): number {
    return Math.max(0, (Date.now() - this.started) / 1000);
  }
  marker(entry: LiveEntry): void {
    if (!this.active() || this.busy()) return;
    this.active.update((take) =>
      take
        ? {
            ...take,
            markers: [
              ...take.markers,
              {
                entryId: entry.id,
                title: entry.title,
                seconds: this.seconds(),
              },
            ],
          }
        : null,
    );
  }
  async stop(interrupted = false): Promise<void> {
    const take = this.active();
    const recorder = this.recorder;
    if (!take || !recorder || this.busy()) return;
    this.busy.set(true);
    try {
      if (recorder.state !== 'inactive')
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });
      await this.writes;
      const audio = new Blob(this.memory, { type: take.mimeType });
      const saved: LiveTake = {
        ...this.active()!,
        duration: this.seconds(),
        status: interrupted ? 'interrupted' : 'saved',
      };
      try {
        const chunks = await this.store.entries<Blob>(`chunk:${take.id}:`);
        await this.store.write(
          [
            { key: `audio:${take.id}`, value: audio },
            { key: `take:${take.id}`, value: saved },
          ],
          chunks.map((c) => c.key),
        );
        this.takes.update((takes) => [saved, ...takes]);
        this.memory = [];
      } catch {
        this.emergency = audio;
        this.error.set(
          'Audio non salvato: scarica subito la copia di emergenza prima di chiudere.',
        );
      }
    } catch {
      this.emergency = new Blob(this.memory, { type: take.mimeType });
      this.error.set(
        'Salvataggio interrotto. Scarica subito la copia di emergenza.',
      );
    } finally {
      this.active.set(null);
      this.cleanup();
      this.busy.set(false);
    }
  }
  emergencyBlob(): Blob | undefined {
    return this.emergency;
  }
  async audio(id: string): Promise<Blob> {
    const blob = await this.store.get<Blob>(`audio:${id}`);
    if (!blob?.size)
      throw new Error('Nessun audio recuperabile per questa take.');
    return blob;
  }
  async remove(id: string): Promise<void> {
    const chunks = await this.store.entries<Blob>(`chunk:${id}:`);
    await this.store.write(
      [],
      [`audio:${id}`, `take:${id}`, ...chunks.map((c) => c.key)],
    );
    this.takes.update((takes) => takes.filter((t) => t.id !== id));
  }
  private cleanup(): void {
    if (this.timer) clearInterval(this.timer);
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    this.stream = undefined;
  }
}
export function time(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
