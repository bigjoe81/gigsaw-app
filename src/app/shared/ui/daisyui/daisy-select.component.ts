import { AfterViewInit, Component, ElementRef, ViewChild, computed, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-daisy-select',
  standalone: true,
  template: `
    <select
      #selectElement
      class="gigsaw-control select w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] focus:outline-none {{ controlClass() }}"
      [class.select-error]="invalid()"
      [class.select-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
      [multiple]="multiple()"
      [disabled]="disabled()"
      [value]="multiple() ? '' : singleValue()"
      (change)="onSelect($event)"
      (blur)="blurred.emit()"
    >
      <ng-content />
    </select>
  `,
})
export class DaisySelectComponent implements AfterViewInit {
  @ViewChild('selectElement') private selectElement?: ElementRef<HTMLSelectElement>;

  readonly multiple = input(false);
  readonly controlClass = input('');
  readonly value = input<string | string[]>('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);

  readonly valueChange = output<string | string[]>();
  readonly blurred = output<void>();

  private readonly viewReady = signal(false);
  readonly singleValue = computed(() => {
    const value = this.value();
    return Array.isArray(value) ? '' : value;
  });

  constructor() {
    effect(() => {
      const value = this.value();
      const multiple = this.multiple();
      const ready = this.viewReady();

      if (ready && multiple) {
        queueMicrotask(() => this.syncSelectedOptions(value));
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  onSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = this.multiple()
      ? Array.from(select.selectedOptions).map((option) => option.value)
      : select.value;

    this.valueChange.emit(value);
  }

  private syncSelectedOptions(value: string | string[]): void {
    const host = this.selectElement?.nativeElement;
    if (!host) return;

    const selected = new Set(Array.isArray(value) ? value : []);
    Array.from(host.options).forEach((option) => {
      option.selected = selected.has(option.value);
    });
  }
}
