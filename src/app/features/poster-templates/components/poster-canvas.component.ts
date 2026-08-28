import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { PosterField, PosterTemplateDocument } from '../models/poster-template.models';

type Interaction = { id: string; mode: 'move' | 'resize'; startX: number; startY: number; fieldX: number; fieldY: number; fieldWidth: number };

@Component({
  selector: 'app-poster-canvas',
  standalone: true,
  template: `<canvas #canvas class="block h-auto max-h-[72vh] max-w-full touch-none rounded-lg shadow-2xl"
    (pointerdown)="pointerDown($event)" (pointermove)="pointerMove($event)" (pointerup)="pointerUp()"
    (pointercancel)="pointerUp()" aria-label="Editor visuale della locandina"></canvas>`,
})
export class PosterCanvasComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) document!: PosterTemplateDocument;
  @Input() selectedId: string | null = null;
  @Input() interactive = true;
  @Output() selectedIdChange = new EventEmitter<string>();
  @Output() fieldChange = new EventEmitter<PosterField>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private background: HTMLImageElement | null = null;
  private interaction: Interaction | null = null;
  private readonly handleSize = 28;

  ngAfterViewInit(): void { this.syncCanvas(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document']) this.loadBackground();
    queueMicrotask(() => this.draw());
  }

  @HostListener('window:resize') redraw(): void { this.draw(); }

  exportPng(): string {
    const selected = this.selectedId;
    this.selectedId = null;
    this.draw();
    const result = this.canvasRef.nativeElement.toDataURL('image/png', 1);
    this.selectedId = selected;
    this.draw();
    return result;
  }

  pointerDown(event: PointerEvent): void {
    if (!this.interactive) return;
    const point = this.toDocumentPoint(event);
    const field = [...this.document.fields].reverse().find((item) => this.hit(item, point.x, point.y));
    if (!field) return;
    this.selectedId = field.id;
    this.selectedIdChange.emit(field.id);
    const resize = point.x >= field.x + field.width - this.handleSize && point.y >= field.y + field.fontSize - this.handleSize;
    this.interaction = { id: field.id, mode: resize ? 'resize' : 'move', startX: point.x, startY: point.y, fieldX: field.x, fieldY: field.y, fieldWidth: field.width };
    this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
    this.draw();
  }

  pointerMove(event: PointerEvent): void {
    if (!this.interaction) return;
    const field = this.document.fields.find((item) => item.id === this.interaction?.id);
    if (!field) return;
    const point = this.toDocumentPoint(event);
    if (this.interaction.mode === 'move') {
      field.x = this.clamp(this.interaction.fieldX + point.x - this.interaction.startX, 0, this.document.format.width - field.width);
      field.y = this.clamp(this.interaction.fieldY + point.y - this.interaction.startY, 0, this.document.format.height - field.fontSize);
    } else {
      field.width = this.clamp(this.interaction.fieldWidth + point.x - this.interaction.startX, 120, this.document.format.width - field.x);
    }
    this.fieldChange.emit({ ...field });
    this.draw();
  }

  pointerUp(): void { this.interaction = null; }

  private syncCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.document.format.width;
    canvas.height = this.document.format.height;
    this.loadBackground();
  }

  private loadBackground(): void {
    if (!this.document || !this.canvasRef) return;
    this.canvasRef.nativeElement.width = this.document.format.width;
    this.canvasRef.nativeElement.height = this.document.format.height;
    if (!this.document.backgroundDataUrl) { this.background = null; this.draw(); return; }
    const image = new Image();
    image.onload = () => { this.background = image; this.draw(); };
    image.src = this.document.backgroundDataUrl;
  }

  private draw(): void {
    if (!this.canvasRef || !this.document) return;
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#171717';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (this.background) this.drawCover(context, this.background, canvas.width, canvas.height);
    for (const field of this.document.fields) this.drawField(context, field);
  }

  private drawField(context: CanvasRenderingContext2D, field: PosterField): void {
    context.save();
    context.font = `700 ${field.fontSize}px ${field.fontFamily}`;
    context.fillStyle = field.color;
    context.textBaseline = 'top';
    context.textAlign = field.textAlign;
    const x = field.textAlign === 'center' ? field.x + field.width / 2 : field.textAlign === 'right' ? field.x + field.width : field.x;
    const value = field.uppercase ? field.sampleValue.toUpperCase() : field.sampleValue;
    context.fillText(value, x, field.y, field.width);
    if (field.id === this.selectedId) {
      context.strokeStyle = '#f97316';
      context.lineWidth = 5;
      context.setLineDash([14, 10]);
      context.strokeRect(field.x - 8, field.y - 8, field.width + 16, field.fontSize + 16);
      context.setLineDash([]);
      context.fillStyle = '#f97316';
      context.fillRect(field.x + field.width - this.handleSize / 2, field.y + field.fontSize - this.handleSize / 2, this.handleSize, this.handleSize);
    }
    context.restore();
  }

  private drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
    const scale = Math.max(width / image.width, height / image.height);
    const w = image.width * scale, h = image.height * scale;
    context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  }

  private toDocumentPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * this.document.format.width / rect.width, y: (event.clientY - rect.top) * this.document.format.height / rect.height };
  }

  private hit(field: PosterField, x: number, y: number): boolean {
    return x >= field.x - 10 && x <= field.x + field.width + 10 && y >= field.y - 10 && y <= field.y + field.fontSize + 10;
  }

  private clamp(value: number, min: number, max: number): number { return Math.min(Math.max(value, min), max); }
}
