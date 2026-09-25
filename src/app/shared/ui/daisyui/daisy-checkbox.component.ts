import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-checkbox',
  standalone: true,
  template: `
    <input
      class="gigsaw-control checkbox checkbox-primary border border-solid border-[#3b5273] bg-[#0f172a] focus:outline-none {{ controlClass() }}"
      [class.checkbox-error]="invalid()"
      [class.checkbox-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
      type="checkbox"
      [disabled]="disabled()"
      [checked]="checked()"
      (change)="onToggle($event)"
      (blur)="blurred.emit()"
    />
  `,
})
export class DaisyCheckboxComponent {
  readonly controlClass = input('');
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);

  readonly checkedChange = output<boolean>();
  readonly blurred = output<void>();

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(checked);
  }
}
