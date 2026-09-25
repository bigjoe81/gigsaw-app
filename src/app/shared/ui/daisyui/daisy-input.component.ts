import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-input',
  standalone: true,
  template: `
    <input
      class="gigsaw-control input w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] placeholder:text-[#64748b] focus:outline-none {{ controlClass() }}"
      [class.input-error]="invalid()"
      [class.input-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
      [type]="type()"
      [name]="name()"
      [placeholder]="placeholder()"
      [autocomplete]="autocomplete()"
      [attr.inputmode]="inputMode() || null"
      [attr.maxlength]="maxLength()"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="blurred.emit()"
    />
  `,
})
export class DaisyInputComponent {
  readonly type = input('text');
  readonly name = input('');
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly inputMode = input('');
  readonly maxLength = input<number | null>(null);
  readonly controlClass = input('');
  readonly value = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }
}
