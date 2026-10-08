import { JsonPipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonCheckbox, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { PosterCanvasComponent } from '../components/poster-canvas.component';
import { POSTER_FIELD_PRESETS, POSTER_FORMATS, PosterField, PosterFieldKey, PosterFormatId, PosterTemplateDocument, PosterTemplate } from '../models/poster-template.models';
import { PosterTemplateService } from '../services/poster-template.service';

type PosterZone = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface PosterLayoutSuggestion {
  zone: PosterZone;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

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
  variants: PosterTemplate[] = [];
  groupId?: string;
  private drafts = new Map<PosterFormatId, PosterTemplateDocument>();
  name = 'Nuova locandina';
  selectedId: string | null = null;
  analyzingLayout = false;
  layoutHint = '';
  document: PosterTemplateDocument = this.emptyDocument('instagram-post');

  constructor(route: ActivatedRoute, private readonly router: Router, private readonly storage: PosterTemplateService, private readonly toast: ToastController) {
    this.bandId = route.snapshot.parent?.parent?.paramMap.get('bandId') ?? '';
    this.templateId = route.snapshot.paramMap.get('templateId');
    const stored = this.templateId ? storage.get(this.bandId, this.templateId) : undefined;
    if (stored) {
      this.name = stored.name; this.document = structuredClone(stored.document); this.groupId = stored.groupId;
      this.variants = storage.list(this.bandId).filter(item => item.groupId === this.groupId);
      for (const variant of this.variants) this.drafts.set(variant.document.format.id, structuredClone(variant.document));
    }
  }

  get selected(): PosterField | undefined { return this.document.fields.find((field) => field.id === this.selectedId); }

  changeFormat(id: PosterFormatId | string): void {
    const format = this.formats.find((item) => item.id === id);
    if (!format) return;
    this.drafts.set(this.document.format.id, structuredClone(this.document));
    const draft = this.drafts.get(format.id);
    this.selectedId = null;
    if (draft) { this.document = structuredClone(draft); return; }
    const old = this.document.format;
    this.document = { ...this.document, format: { ...format }, fields: this.document.fields.map((field) => ({ ...field, x: field.x * format.width / old.width, y: field.y * format.height / old.height, width: Math.min(field.width * format.width / old.width, format.width) })) };
  }

  uploadBackground(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) { void this.message('Seleziona un file PNG o JPG.', 'warning'); return; }
    if (file.size > 8 * 1024 * 1024) { void this.message('Lo sfondo non può superare 8 MB.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      this.document = { ...this.document, backgroundDataUrl: String(reader.result) };
      await this.suggestLayout(this.document.fields.length === 0);
    };
    reader.readAsDataURL(file);
  }

  async suggestLayout(addDefaults = false): Promise<void> {
    if (!this.document.backgroundDataUrl || this.analyzingLayout) return;
    this.analyzingLayout = true;
    try {
      const suggestion = await this.analyzeBackground(this.document.backgroundDataUrl);
      if (!suggestion) return;
      if (addDefaults && !this.document.fields.length) this.addDefaultFields();
      if (this.document.fields.length) this.applySuggestion(suggestion);
      this.layoutHint = `Testi suggeriti ${this.zoneLabel(suggestion.zone)} · ${suggestion.color === '#ffffff' ? 'chiari' : 'scuri'}`;
      await this.message('Ho disposto i testi nella zona visivamente più libera.', 'success');
    } finally {
      this.analyzingLayout = false;
    }
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

  async save(): Promise<void> {
    if (!this.name.trim()) { await this.message('Inserisci un nome per il template.', 'warning'); return; }
    this.drafts.set(this.document.format.id, structuredClone(this.document));
    let active: PosterTemplate | undefined;
    for (const [formatId, document] of this.drafts) {
      const existing = this.variants.find(variant => variant.document.format.id === formatId);
      const item = this.storage.save(this.bandId, this.name, document, existing?.id, this.groupId);
      this.groupId = item.groupId;
      if (formatId === this.document.format.id) active = item;
    }
    this.variants = this.storage.list(this.bandId).filter(item => item.groupId === this.groupId);
    await this.message('Template salvato sul dispositivo.', 'success');
    if (active && active.id !== this.templateId) await this.router.navigate(['/band', this.bandId, 'locandine', active.id, 'modifica']);
  }

  exportPng(): void {
    const dataUrl = this.canvas?.exportPng();
    if (!dataUrl) return;
    const link = window.document.createElement('a');
    link.download = `${this.slug(this.name)}-${this.document.format.width}x${this.document.format.height}.png`;
    link.href = dataUrl; link.click();
  }

  trackField(_: number, field: PosterField): string { return field.id; }

  private addDefaultFields(): void {
    const keys: PosterFieldKey[] = ['eventName', 'date', 'time', 'venue', 'city'];
    this.document = {
      ...this.document,
      fields: keys.map((key, index) => {
        const preset = this.presets.find((item) => item.key === key)!;
        return {
          ...preset,
          id: `${key}-${Date.now()}-${index}`,
          x: 80,
          y: 100 + index * 100,
          width: this.document.format.width - 160,
          fontFamily: 'Arial',
          fontSize: key === 'eventName' ? 84 : key === 'date' ? 58 : 46,
          color: '#ffffff',
          textAlign: 'center' as const,
          uppercase: key === 'eventName' || key === 'venue',
        };
      }),
    };
  }

  private applySuggestion(suggestion: PosterLayoutSuggestion): void {
    const { width, height } = this.document.format;
    const blockWidth = width * suggestion.widthRatio;
    const startX = width * suggestion.xRatio;
    const startY = height * suggestion.yRatio;
    const gap = height * 0.012;
    const sizes: Partial<Record<PosterFieldKey, number>> = {
      eventName: Math.round(width * 0.075),
      date: Math.round(width * 0.052),
      time: Math.round(width * 0.042),
      venue: Math.round(width * 0.048),
      city: Math.round(width * 0.038),
      address: Math.round(width * 0.03),
      admission: Math.round(width * 0.035),
    };

    let cursorY = startY;
    const fields = this.document.fields.map((field) => {
      const fontSize = sizes[field.key] ?? field.fontSize;
      const estimatedHeight = fontSize * (field.key === 'eventName' ? 1.45 : 1.25);
      const placed = {
        ...field,
        x: startX,
        y: cursorY,
        width: blockWidth,
        fontSize,
        color: suggestion.color,
        textAlign: suggestion.textAlign,
      };
      cursorY += estimatedHeight + gap;
      return placed;
    });
    this.document = { ...this.document, fields };
    this.selectedId = fields[0]?.id ?? null;
  }

  private async analyzeBackground(dataUrl: string): Promise<PosterLayoutSuggestion | null> {
    const image = await this.loadImage(dataUrl);
    const canvas = window.document.createElement('canvas');
    const maxDimension = 360;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const zones: Array<{ zone: PosterZone; x: number; y: number; w: number; h: number; align: 'left' | 'center' | 'right' }> = [
      { zone: 'top-left', x: .04, y: .04, w: .52, h: .36, align: 'left' },
      { zone: 'top-center', x: .18, y: .04, w: .64, h: .36, align: 'center' },
      { zone: 'top-right', x: .44, y: .04, w: .52, h: .36, align: 'right' },
      { zone: 'bottom-left', x: .04, y: .60, w: .52, h: .36, align: 'left' },
      { zone: 'bottom-center', x: .18, y: .60, w: .64, h: .36, align: 'center' },
      { zone: 'bottom-right', x: .44, y: .60, w: .52, h: .36, align: 'right' },
    ];

    const results = zones.map((zone) => {
      const sx = Math.floor(canvas.width * zone.x);
      const sy = Math.floor(canvas.height * zone.y);
      const sw = Math.max(1, Math.floor(canvas.width * zone.w));
      const sh = Math.max(1, Math.floor(canvas.height * zone.h));
      const pixels = ctx.getImageData(sx, sy, Math.min(sw, canvas.width - sx), Math.min(sh, canvas.height - sy));
      let luminanceTotal = 0;
      let luminanceSquared = 0;
      let edges = 0;
      let previous = -1;
      let samples = 0;
      for (let i = 0; i < pixels.data.length; i += 16) {
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        luminanceTotal += lum;
        luminanceSquared += lum * lum;
        if (previous >= 0 && Math.abs(lum - previous) > 34) edges++;
        previous = lum;
        samples++;
      }
      const mean = luminanceTotal / Math.max(1, samples);
      const variance = Math.max(0, luminanceSquared / Math.max(1, samples) - mean * mean);
      const edgeRatio = edges / Math.max(1, samples);
      const clutter = variance / 6500 + edgeRatio * 2.2;
      return { ...zone, mean, clutter };
    });

    results.sort((a, b) => a.clutter - b.clutter);
    const best = results[0];
    if (!best) return null;
    const margin = best.align === 'left' ? .07 : best.align === 'right' ? .38 : .15;
    return {
      zone: best.zone,
      xRatio: margin,
      yRatio: best.zone.startsWith('top') ? .08 : .62,
      widthRatio: best.align === 'center' ? .70 : .56,
      textAlign: best.align,
      color: best.mean < 142 ? '#ffffff' : '#111827',
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Immagine non leggibile'));
      image.src = src;
    });
  }

  private zoneLabel(zone: PosterZone): string {
    const labels: Record<PosterZone, string> = {
      'top-left': 'in alto a sinistra',
      'top-center': 'in alto',
      'top-right': 'in alto a destra',
      'bottom-left': 'in basso a sinistra',
      'bottom-center': 'in basso',
      'bottom-right': 'in basso a destra',
    };
    return labels[zone];
  }

  private emptyDocument(formatId: PosterFormatId): PosterTemplateDocument {
    const format = POSTER_FORMATS.find((item) => item.id === formatId) ?? POSTER_FORMATS[0];
    return { version: 1, format: { ...format }, backgroundDataUrl: null, fields: [] };
  }
  private slug(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'locandina'; }
  private async message(message: string, color: 'success' | 'warning'): Promise<void> { (await this.toast.create({ message, color, duration: 2200 })).present(); }
}
