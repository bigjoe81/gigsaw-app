import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-input',
  standalone: true,
  template: `
    <input
      class="input w-full bg-white {{ controlClass() }}"
      [type]="type()"
      [name]="name()"
      [placeholder]="placeholder()"
      [autocomplete]="autocomplete()"
      [attr.inputmode]="inputMode() || null"
      [attr.maxlength]="maxLength()"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($event)"
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

  readonly valueChange = output<string>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }
}
