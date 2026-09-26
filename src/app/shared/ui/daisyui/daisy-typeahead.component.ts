import { Component, ElementRef, HostListener, computed, input, output, signal } from '@angular/core';

export interface DaisyTypeaheadItem {
  id: string | number;
  label: string;
  description?: string;
  data?: unknown;
}

@Component({
  selector: 'app-daisy-typeahead',
  standalone: true,
  template: `
    <div class="relative w-full">
      <input
        class="gigsaw-control input w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] placeholder:text-[#64748b] focus:outline-none {{ controlClass() }}"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listboxId"
        [attr.aria-activedescendant]="activeDescendant()"
        [class.input-error]="invalid()"
        [class.input-success]="valid() && !invalid()"
        [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
        type="text"
        [name]="name()"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (keydown)="onKeydown($event)"
        (blur)="blurred.emit()"
      />

      @if (open()) {
        <div
          class="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-box border border-[var(--gigsaw-border)] bg-base-100 shadow-xl"
        >
          @if (loading()) {
            <div class="flex items-center gap-2 px-4 py-3 text-sm text-base-content/70">
              <span class="loading loading-spinner loading-sm"></span>
              <span>{{ loadingText() }}</span>
            </div>
          } @else if (visibleItems().length) {
            <ul
              class="list max-h-72 w-full overflow-y-auto p-1.5"
              role="listbox"
              [id]="listboxId"
            >
              @for (item of visibleItems(); track item.id; let index = $index) {
                <li
                  class="list-row cursor-pointer rounded-box px-3 py-2.5 transition-colors hover:bg-base-200"
                  role="option"
                  [id]="optionId(index)"
                  [attr.aria-selected]="index === activeIndex()"
                  [class.bg-base-200]="index === activeIndex()"
                  (mousedown)="select(item, $event)"
                  (mouseenter)="activeIndex.set(index)"
                >
                  <div class="min-w-0">
                    <div class="truncate font-semibold">{{ item.label }}</div>
                    @if (item.description) {
                      <div class="truncate text-xs opacity-60">{{ item.description }}</div>
                    }
                  </div>
                </li>
              }
            </ul>
          } @else if (value().trim().length >= minChars()) {
            <div class="px-4 py-3 text-sm text-base-content/60">{{ emptyMessage() }}</div>
          }
        </div>
      }
    </div>
  `,
})
export class DaisyTypeaheadComponent {
  private static nextId = 0;

  readonly name = input('');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  readonly controlClass = input('');
  readonly value = input('');
  readonly items = input<readonly DaisyTypeaheadItem[]>([]);
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly loading = input(false);
  readonly minChars = input(0);
  readonly maxResults = input(8);
  readonly loadingText = input('Ricerca…');
  readonly emptyMessage = input('Nessun risultato.');
  readonly filterLocally = input(true);

  readonly valueChange = output<string>();
  readonly selected = output<DaisyTypeaheadItem>();
  readonly blurred = output<void>();

  readonly open = signal(false);
  readonly activeIndex = signal(-1);

  readonly listboxId = `daisy-typeahead-${DaisyTypeaheadComponent.nextId++}`;

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

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
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

  select(item: DaisyTypeaheadItem, event?: Event): void {
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
