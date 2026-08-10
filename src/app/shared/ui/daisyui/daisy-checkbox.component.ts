import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-checkbox',
  standalone: true,
  template: `
    <input
      class="checkbox checkbox-primary {{ controlClass() }}"
      type="checkbox"
      [disabled]="disabled()"
      [checked]="checked()"
      (change)="onToggle($event)"
    />
  `,
})
export class DaisyCheckboxComponent {
  readonly controlClass = input('');
  readonly checked = input(false);
  readonly disabled = input(false);

  readonly checkedChange = output<boolean>();

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(checked);
  }
}
