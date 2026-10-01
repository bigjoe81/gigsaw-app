import { JsonPipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonCheckbox, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { PosterCanvasComponent } from '../components/poster-canvas.component';
import { POSTER_FIELD_PRESETS, POSTER_FORMATS, PosterField, PosterFieldKey, PosterFormatId, PosterTemplateDocument } from '../models/poster-template.models';
import { AiPosterSafeArea, AiPosterStyle, PosterTemplateService } from '../services/poster-template.service';

@Component({
  standalone: true,
  imports: [JsonPipe, FormsModule, PosterCanvasComponent, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonCheckbox, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonTitle, IonToolbar],
  templateUrl: './poster-template-editor.page.html',
  styleUrl: './poster-template-editor.page.scss',
})
export class PosterTemplateEditorPage {
  @ViewChild(PosterCanvasComponent) canvas?: PosterCanvasComponent;
  readonly formats = POSTER_FORMATS;
  readonly presets = POSTER_FIELD_PRESETS;
  readonly fonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];
  readonly bandId: string;
  readonly templateId: string | null;
  readonly gigId: number | null;
  readonly aiStyles: ReadonlyArray<{ id: AiPosterStyle; label: string }> = [
    { id: 'vintage', label: 'Vintage' },
    { id: 'rock', label: 'Rock' },
    { id: 'blues', label: 'Blues' },
    { id: 'modern', label: 'Moderno' },
    { id: 'elegant', label: 'Elegante' },
  ];
  aiStyle: AiPosterStyle = 'rock';
  generatingAi = false;
  aiRemaining: number | null = null;
  name = 'Nuova locandina';
  selectedId: string | null = null;
  document: PosterTemplateDocument = this.emptyDocument('instagram-post');

  constructor(route: ActivatedRoute, private readonly router: Router, private readonly storage: PosterTemplateService, private readonly toast: ToastController) {
    this.bandId = route.snapshot.parent?.parent?.paramMap.get('bandId') ?? '';
    this.templateId = route.snapshot.paramMap.get('templateId');
    const gigId = Number(route.snapshot.queryParamMap.get('gigId'));
    this.gigId = Number.isFinite(gigId) && gigId > 0 ? gigId : null;
    const stored = this.templateId ? storage.get(this.bandId, this.templateId) : undefined;
    if (stored) { this.name = stored.name; this.document = structuredClone(stored.document); }
  }

  get selected(): PosterField | undefined { return this.document.fields.find((field) => field.id === this.selectedId); }

  changeFormat(id: PosterFormatId | string): void {
    const format = this.formats.find((item) => item.id === id);
    if (!format) return;
    const old = this.document.format;
    this.document = { ...this.document, format: { ...format }, fields: this.document.fields.map((field) => ({ ...field, x: field.x * format.width / old.width, y: field.y * format.height / old.height, width: Math.min(field.width * format.width / old.width, format.width) })) };
  }

  uploadBackground(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) { void this.message('Seleziona un file PNG o JPG.', 'warning'); return; }
    if (file.size > 8 * 1024 * 1024) { void this.message('Lo sfondo non può superare 8 MB.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = () => { this.document = { ...this.document, backgroundDataUrl: String(reader.result) }; };
    reader.readAsDataURL(file);
  }

  addField(key: PosterFieldKey): void {
    const preset = this.presets.find((item) => item.key === key);
    if (!preset || this.document.fields.some((field) => field.key === key)) return;
    const field: PosterField = { ...preset, id: `${key}-${Date.now()}`, x: 80, y: 100 + this.document.fields.length * 120, width: this.document.format.width - 160, fontFamily: 'Arial', fontSize: key === 'eventName' ? 84 : 52, color: '#ffffff', textAlign: 'center', uppercase: false };
    this.document = { ...this.document, fields: [...this.document.fields, field] };
    this.selectedId = field.id;
  }

  hasField(key: PosterFieldKey): boolean { return this.document.fields.some((field) => field.key === key); }

  removeSelected(): void {
    this.document = { ...this.document, fields: this.document.fields.filter((field) => field.id !== this.selectedId) };
    this.selectedId = null;
  }

  updateSelected(): void { if (this.selected) this.document = { ...this.document, fields: [...this.document.fields] }; }

  async generateAiBackground(): Promise<void> {
    if (!this.gigId || this.generatingAi) return;

    this.generatingAi = true;
    try {
      const format = this.document.format.id === 'instagram-story'
        ? 'story'
        : this.document.format.id === 'square'
          ? 'square'
          : 'poster';

      const result = await firstValueFrom(this.storage.generateAi(this.gigId, this.aiStyle, format));
      const backgroundDataUrl = await this.storage.imageUrlToDataUrl(result.template.image_url);
      this.document = {
        ...this.document,
        backgroundDataUrl,
        fields: this.aiFields(result.template.safe_areas),
      };
      this.aiRemaining = result.ai_quota.remaining;
      this.selectedId = null;
      await this.message(`Template AI generato. Restano ${result.ai_quota.remaining} generazioni beta.`, 'success');
    } catch (error: unknown) {
      const remainingMessage = this.aiRemaining === 0 ? ' Hai raggiunto il limite beta.' : '';
      await this.message(`Generazione AI non riuscita.${remainingMessage}`, 'warning');
    } finally {
      this.generatingAi = false;
    }
  }

  private aiFields(areas: AiPosterSafeArea[]): PosterField[] {
    const width = this.document.format.width;
    const height = this.document.format.height;
    const title = areas.find((area) => area.name === 'title');
    const details = areas.find((area) => area.name === 'details');
    const fields: PosterField[] = [];

    if (title) {
      fields.push({
        id: `eventName-${Date.now()}`,
        key: 'eventName',
        label: 'Nome evento',
        sampleValue: 'NOME BAND / EVENTO',
        x: width * title.x / 100,
        y: height * title.y / 100,
        width: width * title.w / 100,
        fontFamily: 'Impact',
        fontSize: Math.round(width * 0.075),
        color: '#ffffff',
        textAlign: 'center',
        uppercase: true,
      });
    }

    if (details) {
      const x = width * details.x / 100;
      const y = height * details.y / 100;
      const fieldWidth = width * details.w / 100;
      const line = Math.max(42, Math.round(width * 0.045));
      const base = Date.now();

      fields.push(
        { id: `date-${base}`, key: 'date', label: 'Data', sampleValue: 'DATA', x, y, width: fieldWidth, fontFamily: 'Arial', fontSize: line, color: '#ffffff', textAlign: 'center', uppercase: true },
        { id: `time-${base}`, key: 'time', label: 'Ora', sampleValue: 'ORA', x, y: y + line * 1.3, width: fieldWidth, fontFamily: 'Arial', fontSize: line, color: '#ffffff', textAlign: 'center', uppercase: true },
        { id: `venue-${base}`, key: 'venue', label: 'Locale', sampleValue: 'VENUE · CITTÀ', x, y: y + line * 2.6, width: fieldWidth, fontFamily: 'Arial', fontSize: line, color: '#ffffff', textAlign: 'center', uppercase: true },
      );
    }

    return fields;
  }

  async save(): Promise<void> {
    if (!this.name.trim()) { await this.message('Inserisci un nome per il template.', 'warning'); return; }
    const item = this.storage.save(this.bandId, this.name, this.document, this.templateId ?? undefined);
    await this.message('Template salvato sul dispositivo.', 'success');
    if (!this.templateId) await this.router.navigate(['/band', this.bandId, 'locandine', item.id, 'modifica']);
  }

  exportPng(): void {
    const dataUrl = this.canvas?.exportPng();
    if (!dataUrl) return;
    const link = window.document.createElement('a');
    link.download = `${this.slug(this.name)}-${this.document.format.width}x${this.document.format.height}.png`;
    link.href = dataUrl; link.click();
  }

  trackField(_: number, field: PosterField): string { return field.id; }

  private emptyDocument(formatId: PosterFormatId): PosterTemplateDocument {
    const format = POSTER_FORMATS.find((item) => item.id === formatId) ?? POSTER_FORMATS[0];
    return { version: 1, format: { ...format }, backgroundDataUrl: null, fields: [] };
  }
  private slug(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'locandina'; }
  private async message(message: string, color: 'success' | 'warning'): Promise<void> { (await this.toast.create({ message, color, duration: 2200 })).present(); }
}
