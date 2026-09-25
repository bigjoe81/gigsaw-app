import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output, signal } from '@angular/core';
import flatpickr from 'flatpickr';
import { Italian } from 'flatpickr/dist/l10n/it';
import type { Instance } from 'flatpickr/dist/types/instance';

@Component({
  selector: 'app-daisy-datepicker',
  standalone: true,
  template: `
    <input
      #pickerInput
      class="gigsaw-control input w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] placeholder:text-[#64748b] focus:outline-none {{ controlClass() }}"
      [class.input-error]="invalid()"
      [class.input-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
      type="text"
      [name]="name()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
    />
  `,
})
export class DaisyDatepickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pickerInput', { static: true }) private pickerInput!: ElementRef<HTMLInputElement>;

  readonly name = input('');
  readonly placeholder = input('Seleziona una data');
  readonly controlClass = input('');
  readonly value = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  private readonly ready = signal(false);
  private instance?: Instance;

  constructor() {
    effect(() => {
      const value = this.value();
      const valid = this.valid();
      const invalid = this.invalid();
      if (this.ready() && value !== this.instance?.input.value) {
        this.instance?.setDate(value, false, 'Y-m-d');
      }
      if (this.ready()) this.syncValidationClasses(valid, invalid);
    });
  }

  ngAfterViewInit(): void {
    this.instance = flatpickr(this.pickerInput.nativeElement, {
      altInput: true,
      altFormat: 'd/m/Y',
      allowInput: true,
      dateFormat: 'Y-m-d',
      defaultDate: this.value() || undefined,
      disableMobile: true,
      locale: Italian,
      onChange: (_dates, value) => this.valueChange.emit(value),
      onClose: () => this.blurred.emit(),
    });
    this.ready.set(true);
  }

  ngOnDestroy(): void {
    this.instance?.destroy();
  }

  private syncValidationClasses(valid: boolean, invalid: boolean): void {
    this.instance?.altInput?.classList.toggle('input-error', invalid);
    this.instance?.altInput?.classList.toggle('input-success', valid && !invalid);
    if (this.instance?.altInput) {
      this.instance.altInput.style.borderColor = invalid
        ? 'var(--color-error)'
        : valid
          ? 'var(--color-success)'
          : 'var(--gigsaw-input-border)';
    }
  }
}
