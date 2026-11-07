import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SessionService } from './session.service';
import { downloadBlob, openNativePdf } from './device-files';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: ` <main class="page">
    <p class="eyebrow">LA MIA PARTE</p>
    <h1>Quello che serve a te.</h1>
    <p class="lead">Testi, accordi e note personali, pronti da leggere.</p>
    <div class="material-filters">
      <div>
        <label for="role">Il tuo strumento</label
        ><select id="role" [ngModel]="s.role()" (ngModelChange)="role($event)">
          <option>Voce</option>
          <option>Chitarra</option>
          <option>Tastiere</option>
          <option>Basso</option>
          <option>Batteria</option>
          <option>Altro</option>
        </select>
      </div>
      <div>
        <label for="material-song">Elemento della scaletta</label
        ><select
          id="material-song"
          [ngModel]="entryId"
          (ngModelChange)="change($event)"
        >
          @for (entry of s.session().entries; track entry.id) {
            <option [value]="entry.id">{{ entry.title }}</option>
          }
        </select>
      </div>
    </div>
    <p class="muted">
      Materiali personali di questo dispositivo. Lo strumento è una preferenza
      di lettura; assegnazioni e condivisione con altri musicisti non sono
      ancora disponibili.
    </p>
    <div class="material-grid">
      <section class="panel">
        <h2>Testo e accordi</h2>
        <label for="part">La tua parte</label
        ><textarea
          id="part"
          rows="12"
          [ngModel]="partDraft()"
          (ngModelChange)="parts[entryId] = $event"
          placeholder="Incolla qui testo, accordi o indicazioni per la tua parte…"
        ></textarea
        ><button class="primary" (click)="save('parts')" [disabled]="busy">
          Salva la mia parte
        </button>
      </section>
      <section class="panel">
        <h2>Note e patch</h2>
        <label for="note">Indicazioni personali</label
        ><textarea
          id="note"
          rows="5"
          [ngModel]="noteDraft()"
          (ngModelChange)="notes[entryId] = $event"
          placeholder="Suono, attacco, finale…"
        ></textarea
        ><button class="secondary" (click)="save('notes')" [disabled]="busy">
          Salva nota
        </button>
        <hr />
        <h2>PDF personale</h2>
        <label for="pdf">Importa un PDF · massimo 25 MB</label
        ><input
          id="pdf"
          type="file"
          accept="application/pdf"
          (change)="importPdf($event)"
          [disabled]="busy"
        />
        @for (doc of documents; track doc.id) {
          <div class="document-row">
            <strong>{{ doc.name }}</strong>
            <div>
              <button class="text-button" (click)="open(doc.id)">
                Apri PDF</button
              ><button class="text-button" (click)="download(doc.id, doc.name)">
                Scarica PDF</button
              ><button class="text-button" (click)="deleteId = doc.id">
                Rimuovi
              </button>
            </div>
            @if (deleteId === doc.id) {
              <p>Rimuovere questo PDF?</p>
              <button class="danger" (click)="remove(doc.id)">
                Conferma rimozione
              </button>
              <button class="secondary" (click)="deleteId = ''">Annulla</button>
            }
          </div>
        }
        @if (!documents.length) {
          <p class="muted">Nessun PDF per questo elemento.</p>
        }
      </section>
    </div>
    @if (message) {
      <p role="status" class="notice">{{ message }}</p>
    }
    @if (error) {
      <p role="alert" class="notice error">{{ error }}</p>
    }
    @if (pdfUrl) {
      <section class="panel pdf-viewer">
        <div class="page-heading">
          <h2>Il tuo documento</h2>
          <button class="secondary" (click)="closePdf()">Chiudi PDF</button>
        </div>
        <p class="muted">
          Se il dispositivo non mostra l’anteprima, usa “Scarica PDF” per
          aprirlo con il lettore di sistema.
        </p>
        <iframe [src]="pdfUrl" title="PDF personale"></iframe>
      </section>
    }
    <a class="text-link" routerLink="/stage">Torna sul palco →</a>
  </main>`,
})
export class MaterialsPage implements OnDestroy {
  readonly s = inject(SessionService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  entryId = this.s.session().entries[0].id;
  parts: Record<string, string> = {};
  notes: Record<string, string> = {};
  busy = false;
  message = '';
  error = '';
  deleteId = '';
  pdfUrl: SafeResourceUrl | null = null;
  private objectUrl = '';
  constructor() {
    const requested = this.route.snapshot.queryParamMap.get('entry');
    if (requested && this.s.session().entries.some((e) => e.id === requested))
      this.entryId = requested;
  }
  get documents() {
    return this.s.documents().filter((d) => d.entryId === this.entryId);
  }
  partDraft(): string {
    return this.parts[this.entryId] ?? this.s.parts()[this.entryId] ?? '';
  }
  noteDraft(): string {
    return this.notes[this.entryId] ?? this.s.notes()[this.entryId] ?? '';
  }
  change(id: string): void {
    this.entryId = id;
    this.message = '';
    this.error = '';
    this.closePdf();
  }
  role(value: string): void {
    this.s.role.set(value);
    void this.s.preferences();
  }
  async save(kind: 'parts' | 'notes'): Promise<void> {
    this.busy = true;
    this.message = '';
    this.error = '';
    const ok = await this.s.saveText(
      kind,
      this.entryId,
      kind === 'parts' ? this.partDraft() : this.noteDraft(),
    );
    if (ok) this.message = 'Salvato sul dispositivo.';
    this.busy = false;
  }
  async importPdf(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy = true;
    this.error = '';
    try {
      await this.s.importDocument(file, this.entryId);
      this.message = 'PDF salvato sul dispositivo, disponibile senza rete.';
    } catch (error) {
      this.error =
        (error as Error).message ||
        'PDF non salvato. Controlla lo spazio disponibile.';
    } finally {
      input.value = '';
      this.busy = false;
    }
  }
  async open(id: string): Promise<void> {
    try {
      const blob = await this.s.documentBlob(id);
      if (await openNativePdf(blob)) return;
      this.closePdf();
      this.objectUrl = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.objectUrl,
      );
    } catch (error) {
      this.error = (error as Error).message;
    }
  }
  async download(id: string, name: string): Promise<void> {
    try {
      await downloadBlob(await this.s.documentBlob(id), name);
    } catch (error) {
      this.error = (error as Error).message;
    }
  }
  async remove(id: string): Promise<void> {
    try {
      await this.s.removeDocument(id);
      this.closePdf();
      this.deleteId = '';
    } catch {
      this.error = 'PDF non rimosso. Riprova.';
    }
  }
  closePdf(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = '';
    this.pdfUrl = null;
  }
  ngOnDestroy(): void {
    this.closePdf();
  }
}
