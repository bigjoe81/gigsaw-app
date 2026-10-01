import { Component, ElementRef, HostListener, computed, input, output, signal } from '@angular/core';
import { IonInput, IonItem, IonLabel, IonList, IonSpinner, IonNote } from '@ionic/angular/standalone';

export interface GigsawTypeaheadItem {
  id: string | number;
  label: string;
  description?: string;
  data?: unknown;
}

@Component({
  selector: 'app-gigsaw-typeahead',
  standalone: true,
  imports: [IonInput, IonItem, IonLabel, IonList, IonSpinner, IonNote],
  template: `
    <div class="gigsaw-typeahead" [class.dropdown-overlay]="dropdownOverlay()">
      <ion-input [fill]="fill()" [class]="controlClass()" [attr.aria-label]="ariaLabel() || placeholder()" [name]="name()" [placeholder]="placeholder()" [autocomplete]="autocomplete()" [disabled]="disabled()" [value]="value()" [class.ion-invalid]="invalid()" [class.ion-touched]="invalid()" role="combobox" [attr.aria-expanded]="open()" [attr.aria-controls]="listboxId" (ionInput)="onInput($event.detail.value ?? '')" (ionFocus)="onFocus()" (keydown)="onKeydown($event)" (ionBlur)="blurred.emit()" />
      @if (open()) {
        <ion-list [id]="listboxId" role="listbox">
          @if (loading()) { <ion-item><ion-spinner slot="start" /><ion-label>{{ loadingText() }}</ion-label></ion-item> }
          @else if (visibleItems().length) {
            @for (item of visibleItems(); track item.id; let index = $index) {
              <ion-item button role="option" [attr.aria-selected]="index === activeIndex()" (pointerdown)="select(item, $event)">
                <ion-label><h2>{{ item.label }}</h2>@if (item.description) { <p>{{ item.description }}</p> }</ion-label>
              </ion-item>
            }
          } @else if (value().trim().length >= minChars()) { <ion-item><ion-note>{{ emptyMessage() }}</ion-note></ion-item> }
        </ion-list>
      }
    </div>
  `,
  styles: `
    .dropdown-overlay {
      position: relative;
    }

    .dropdown-overlay ion-list {
      position: absolute;
      top: 100%;
      inset-inline: 0;
      z-index: 20;
      max-height: 280px;
      overflow-y: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--gigsaw-border);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  `,
})
export class GigsawTypeaheadComponent {
  private static nextId = 0;

  readonly name = input('');
  readonly fill = input<'outline' | undefined>('outline');
  readonly ariaLabel = input('');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  readonly controlClass = input('');
  readonly value = input('');
  readonly items = input<readonly GigsawTypeaheadItem[]>([]);
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly loading = input(false);
  readonly minChars = input(0);
  readonly maxResults = input(8);
  readonly dropdownOverlay = input(false);
  readonly loadingText = input('Ricerca…');
  readonly emptyMessage = input('Nessun risultato.');
  readonly filterLocally = input(true);

  readonly valueChange = output<string>();
  readonly selected = output<GigsawTypeaheadItem>();
  readonly blurred = output<void>();

  readonly open = signal(false);
  readonly activeIndex = signal(-1);

  readonly listboxId = `gigsaw-typeahead-${GigsawTypeaheadComponent.nextId++}`;

  readonly visibleItems = computed(() => {
    const max = Math.max(1, this.maxResults());
    const items = this.items();
    const query = this.normalize(this.value());

    if (!this.filterLocally() || !query) {
      return items.slice(0, max);
    }

    return items
      .filter((item) => this.normalize(`${item.label} ${item.description ?? ''}`).includes(query))
      .slice(0, max);
  });

  readonly activeDescendant = computed(() => {
    const index = this.activeIndex();
    return this.open() && index >= 0 && index < this.visibleItems().length
      ? this.optionId(index)
      : null;
  });

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  onInput(value: string): void {
    this.valueChange.emit(value);
    this.open.set(value.trim().length >= this.minChars());
    this.activeIndex.set(-1);
  }

  onFocus(): void {
    if (!this.disabled() && this.value().trim().length >= this.minChars()) {
      this.open.set(true);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.visibleItems();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.open()) this.open.set(true);
      if (items.length) this.activeIndex.update((index) => Math.min(index + 1, items.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) this.open.set(true);
      if (items.length) this.activeIndex.update((index) => index <= 0 ? items.length - 1 : index - 1);
      return;
    }

    if (event.key === 'Enter' && this.open()) {
      const index = this.activeIndex();
      if (index >= 0 && index < items.length) {
        event.preventDefault();
        this.select(items[index], event);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  select(item: GigsawTypeaheadItem, event?: Event): void {
    event?.preventDefault();
    this.selected.emit(item);
    this.close();
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
