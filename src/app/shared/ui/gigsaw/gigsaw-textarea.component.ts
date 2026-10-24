import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-gigsaw-textarea',
  standalone: true,
  template: `
    <textarea
      class="textarea w-full"
      [id]="id()"
      [name]="name()"
      [placeholder]="placeholder()"
      [rows]="rows()"
      [attr.maxlength]="maxLength()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [required]="required()"
      [readOnly]="readOnly()"
      [disabled]="disabled() || formDisabled()"
      [value]="value() ?? currentValue()"
      [class.is-invalid]="invalid()"
      [class.is-valid]="valid() && !invalid()"
      [class]="controlClass()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    ></textarea>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GigsawTextareaComponent), multi: true }],
  styles: [':host { display: contents; } :host(.ng-invalid.ng-touched) .textarea { border-color: var(--color-error); }'],
})
export class GigsawTextareaComponent implements ControlValueAccessor {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly rows = input(4);
  readonly maxLength = input<number | null>(null);
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaDescribedBy = input('', { alias: 'aria-describedby' });
  readonly required = input(false);
  readonly readOnly = input(false);
  readonly value = input<string | null>();
  readonly controlClass = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly currentValue = signal('');
  readonly formDisabled = signal(false);
  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.currentValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.currentValue.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }
}
