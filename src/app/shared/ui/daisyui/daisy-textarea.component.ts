import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-textarea',
  standalone: true,
  template: `
    <textarea
      class="gigsaw-control textarea w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] placeholder:text-[#64748b] focus:outline-none {{ controlClass() }}"
      [class.textarea-error]="invalid()"
      [class.textarea-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
      [name]="name()"
      [placeholder]="placeholder()"
      [rows]="rows()"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="blurred.emit()"
    ></textarea>
  `,
})
export class DaisyTextareaComponent {
  readonly name = input('');
  readonly placeholder = input('');
  readonly rows = input(4);
  readonly controlClass = input('');
  readonly value = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
