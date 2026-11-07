import { Injectable, signal } from '@angular/core';
import type { LiveDocument, LiveSession } from '@gigsaw/models';
import { LocalStore } from './local-store';
import { DEMO } from './demo';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly session = signal<LiveSession>(DEMO);
  readonly ready = signal(false);
  readonly cached = signal(false);
  readonly online = signal(navigator.onLine);
  readonly error = signal('');
  readonly notes = signal<Record<string, string>>({});
  readonly parts = signal<Record<string, string>>({});
  readonly documents = signal<LiveDocument[]>([]);
  readonly position = signal(0);
  readonly fontSize = signal(26);
  readonly role = signal('Tastiere');
  readonly storagePersistent = signal(false);
  readonly initialized: Promise<void>;
  constructor(private readonly store: LocalStore) {
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
    this.initialized = this.restore();
  }
  private async restore(): Promise<void> {
    try {
      const [session, notes, parts, docs, preferences] = await Promise.all([
        this.store.get<LiveSession>('session'),
        this.store.get<Record<string, string>>('notes'),
        this.store.get<Record<string, string>>('parts'),
        this.store.entries<LiveDocument>('document-meta:'),
        this.store.get<{ position: number; fontSize: number; role: string }>(
          'preferences',
        ),
      ]);
      if (session) {
        this.session.set(session);
        this.cached.set(true);
      }
      this.notes.set(notes ?? {});
      this.parts.set(parts ?? {});
      this.documents.set(docs.map((d) => d.value));
      if (preferences) {
        this.position.set(
          Math.max(
            0,
            Math.min(this.session().entries.length - 1, preferences.position),
          ),
        );
        this.fontSize.set(Math.max(18, Math.min(48, preferences.fontSize)));
        this.role.set(preferences.role);
      }
      this.storagePersistent.set(
        (await navigator.storage?.persisted?.()) ?? false,
      );
    } catch {
      this.error.set(
        'Archivio locale non disponibile. Non possiamo confermare i salvataggi.',
      );
    } finally {
      this.ready.set(true);
    }
  }
  async download(): Promise<void> {
    try {
      await this.initialized;
      await this.store.write([{ key: 'session', value: this.session() }]);
      const check = await this.store.get<LiveSession>('session');
      if (check?.id !== this.session().id) throw new Error('Verifica fallita');
      this.cached.set(true);
      this.error.set('');
      this.storagePersistent.set(
        (await navigator.storage?.persist?.()) ?? false,
      );
    } catch {
      this.error.set(
        'Download non riuscito: spazio esaurito o archivio non disponibile. Riprova.',
      );
    }
  }
  async saveText(
    kind: 'notes' | 'parts',
    entryId: string,
    text: string,
  ): Promise<boolean> {
    try {
      await this.initialized;
      const target = kind === 'notes' ? this.notes : this.parts;
      const next = { ...target(), [entryId]: text };
      await this.store.write([{ key: kind, value: next }]);
      target.set(next);
      this.error.set('');
      return true;
    } catch {
      this.error.set(
        'Testo non salvato. Mantieni aperta questa schermata e riprova.',
      );
      return false;
    }
  }
  async preferences(): Promise<void> {
    try {
      await this.store.write([
        {
          key: 'preferences',
          value: {
            position: this.position(),
            fontSize: this.fontSize(),
            role: this.role(),
          },
        },
      ]);
    } catch {
      this.error.set('Preferenze non salvate su questo dispositivo.');
    }
  }
  async importDocument(file: File, entryId: string): Promise<void> {
    if (file.type !== 'application/pdf' || file.size > 25 * 1024 * 1024)
      throw new Error('Scegli un PDF fino a 25 MB.');
    const doc: LiveDocument = {
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type,
      entryId,
    };
    await this.store.write([
      { key: `document-meta:${doc.id}`, value: doc },
      { key: `document:${doc.id}`, value: file },
    ]);
    this.documents.update((docs) => [...docs, doc]);
  }
  async documentBlob(id: string): Promise<Blob> {
    const blob = await this.store.get<Blob>(`document:${id}`);
    if (!blob)
      throw new Error('Documento non disponibile su questo dispositivo.');
    return blob;
  }
  async removeDocument(id: string): Promise<void> {
    await this.store.write([], [`document:${id}`, `document-meta:${id}`]);
    this.documents.update((docs) => docs.filter((doc) => doc.id !== id));
  }
}
