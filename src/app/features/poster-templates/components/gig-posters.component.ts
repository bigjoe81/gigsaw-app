import { NativeUiModule } from '../../../shared/ui/native-ui';
import { Component, Input, OnChanges, ViewChildren, QueryList } from '@angular/core';
import { PosterCanvasComponent } from './poster-canvas.component';
import { PosterTemplateDocument } from '../models/poster-template.models';
import { PosterTemplateService } from '../services/poster-template.service';
import { a4Pdf } from '../services/poster-export';

export interface GigPoster {
  templateId: string;
  name: string;
  document: PosterTemplateDocument;
}
export interface GigPosterValues {
  title: string; date: string; time: string;
  venue: string; city: string; address: string; admission: string;
}

@Component({
  selector: 'app-gig-posters', standalone: true,
  imports: [NativeUiModule, PosterCanvasComponent],
  template: `
    <section class="grid gap-5 border-t border-[var(--gigsaw-border)] py-[30px]">
      <h2 class="m-0 text-base font-extrabold">Locandine del concerto</h2>
      @if (!readOnly) {
      <span class="text-sm font-semibold">Locandine e formati da compilare</span>
      @for (group of modelGroups; track group[0].groupId) {
        <label class="grid gap-2 text-sm font-semibold text-[var(--gigsaw-text)]">
          <span>{{ group[0].name }}</span>
          <select class="select w-full" [attr.aria-label]="'Formati di ' + group[0].name" [multiple]="true"
            [appSelectValue]="selectedFor(group)" (selectionChange)="selectGroup(group, $event)" appSelect>
            @for (model of group; track model.id) {
              <option [value]="model.id">{{ model.document.format.label }}</option>
            }
          </select>
        </label>
      }
      @if (missingModels.length) {
        <label class="grid gap-2 text-sm font-semibold">
          <span>Copie salvate senza modello</span>
          <select class="select w-full" aria-label="Copie salvate senza modello" [multiple]="true"
            [appSelectValue]="missingModelsIds" (selectionChange)="selectMissing($event)" appSelect>
            @for (poster of missingModels; track poster.templateId) {
              <option [value]="poster.templateId">{{ poster.name }} · {{ poster.document.format.label }}</option>
            }
          </select>
        </label>
      }
      @if (!models.length) { <small class="text-sm">Crea un modello nella sezione Modelli di locandina per aggiungere nuove locandine.</small> }
      <small class="text-sm">Le copie compilate vengono assegnate al concerto quando lo salvi e restano disponibili in questo browser.</small>
      }
      @if (readOnly && !posters.length) { <small class="text-sm">Nessuna locandina assegnata a questo concerto.</small> }
      @for (poster of posters; track poster.templateId; let index = $index) {
        <article class="grid gap-3">
          <strong>{{ poster.name }} · {{ poster.document.format.label }}</strong>
          <app-poster-canvas class="poster-thumbnail" [document]="poster.document" [interactive]="false" />
          <div>
            @if (!readOnly) { <app-gigsaw-button tone="unstyled" buttonClass="btn btn-outline" type="button" (click)="refresh(index)">Aggiorna dai dati del concerto</app-gigsaw-button> }
            <app-gigsaw-button tone="unstyled" buttonClass="btn btn-primary" type="button" [disabled]="exporting" (click)="download(index)">
              Esporta {{ poster.document.format.id === 'a4' ? 'PDF A4' : 'PNG' }}
            </app-gigsaw-button>
          </div>
        </article>
      }
      @if (error) { <small class="text-sm text-error" role="alert">{{ error }}</small> }
    </section>`,
})
export class GigPostersComponent implements OnChanges {
  @Input() readOnly = false;
  @Input() bandId = '';
  @Input() gigId?: number;
  @Input({ required: true }) values!: GigPosterValues;
  @ViewChildren(PosterCanvasComponent) canvases!: QueryList<PosterCanvasComponent>;
  models: ReturnType<PosterTemplateService['list']> = [];
  posters: GigPoster[] = [];
  exporting = false;
  error = '';
  constructor(private readonly templates: PosterTemplateService) {}
  get selectedIds(): string[] { return this.posters.map(item => item.templateId); }
  get missingModels(): GigPoster[] { return this.posters.filter(item => !this.models.some(model => model.id === item.templateId)); }
  get modelGroups(): typeof this.models[] {
    const groups = new Map<string, typeof this.models>();
    for (const model of this.models) {
      const key = model.groupId ?? model.id;
      groups.set(key, [...(groups.get(key) ?? []), model]);
    }
    return [...groups.values()];
  }
  get missingModelsIds(): string[] { return this.missingModels.map(item => item.templateId); }
  selectedFor(group: typeof this.models): string[] {
    return this.selectedIds.filter(id => group.some(model => model.id === id));
  }
  selectGroup(group: typeof this.models, ids: string[]): void {
    this.select([...this.selectedIds.filter(id => !group.some(model => model.id === id)), ...(ids ?? [])]);
  }
  selectMissing(ids: string[]): void {
    this.select([...this.selectedIds.filter(id => !this.missingModelsIds.includes(id)), ...(ids ?? [])]);
  }
  ngOnChanges(changes: Record<string, unknown>): void {
    if (changes['bandId'] || changes['gigId']) {
      this.models = this.templates.list(this.bandId);
      try { this.posters = JSON.parse(localStorage.getItem(this.key(this.gigId)) ?? '[]'); }
      catch { this.posters = []; }
    }
  }
  select(ids: string[]): void {
    this.posters = (ids ?? []).reduce<GigPoster[]>((result, id) => {
      const existing = this.posters.find(item => item.templateId === id);
      if (existing) return [...result, existing];
      const model = this.models.find(item => item.id === id);
      return model ? [...result, { templateId: id, name: model.name, document: this.compile(model.document) }] : result;
    }, []);
  }
  refresh(index: number): void {
    this.posters = this.posters.map((poster, i) => i === index ? { ...poster, document: this.compile(poster.document) } : poster);
  }
  persist(gigId: number): void { localStorage.setItem(this.key(gigId), JSON.stringify(this.posters)); }
  private key(id?: number): string { return `gigsaw.gig-posters.v1:${this.bandId}:${id ?? 'new'}`; }
  private compile(source: PosterTemplateDocument): PosterTemplateDocument {
    const value = this.values;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value.date)
      ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value.date}T12:00:00`)) : '';
    const fields = { eventName: value.title, date, time: value.time ? `ORE ${value.time}` : '', venue: value.venue, city: value.city, address: value.address, admission: value.admission };
    const document = structuredClone(source);
    document.fields = document.fields.map(field => ({ ...field, sampleValue: fields[field.key] }));
    return document;
  }
  async download(index: number): Promise<void> {
    this.exporting = true; this.error = '';
    try {
      const poster = this.posters[index];
      const canvas = this.canvases.get(index);
      if (!canvas) throw new Error('Anteprima non disponibile.');
      const pdf = poster.document.format.id === 'a4';
      const image = await canvas.exportBlob(pdf ? 'image/jpeg' : 'image/png');
      const blob = pdf ? a4Pdf(new Uint8Array(await image.arrayBuffer()), poster.document.format.width, poster.document.format.height) : image;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(this.values.title || poster.name).replace(/[^a-zA-Z0-9àèéìòù_-]+/g, '-')}-${poster.document.format.id}.${pdf ? 'pdf' : 'png'}`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) { this.error = error instanceof Error ? error.message : 'Esportazione non riuscita.'; }
    finally { this.exporting = false; }
  }
}
