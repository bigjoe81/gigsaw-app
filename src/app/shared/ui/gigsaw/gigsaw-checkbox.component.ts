import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-gigsaw-checkbox',
  standalone: true,
  template: `
    <input
      class="checkbox checkbox-primary"
      [id]="id()"
      [name]="name()"
      [attr.aria-label]="ariaLabel() || null"
      [checked]="checked() ?? currentValue()"
      [indeterminate]="indeterminate()"
      [disabled]="disabled() || formDisabled()"
      [class]="controlClass()"
      type="checkbox"
      (change)="onChangeEvent($event)"
      (blur)="onBlur()"
    />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GigsawCheckboxComponent), multi: true }],
  styles: [':host { display: contents; }'],
})
export class GigsawCheckboxComponent implements ControlValueAccessor {
  readonly id = input('');
  readonly name = input('');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly controlClass = input('');
  readonly checked = input<boolean | null>(null);
  readonly indeterminate = input(false);
  readonly currentValue = signal(false);
  readonly disabled = input(false);
  readonly formDisabled = signal(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly checkedChange = output<boolean>();
  readonly blurred = output<void>();

  private onChange: (checked: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean | null): void {
    this.currentValue.set(Boolean(value));
  }

  registerOnChange(fn: (checked: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  onChangeEvent(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.currentValue.set(checked);
    this.onChange(checked);
    this.checkedChange.emit(checked);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }
}
