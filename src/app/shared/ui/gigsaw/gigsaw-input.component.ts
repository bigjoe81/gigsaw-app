import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-gigsaw-input',
  standalone: true,
  template: `
    <input
      class="input w-full"
      [id]="id()"
      [type]="type()"
      [name]="name()"
      [attr.tabindex]="tabIndex()"
      [placeholder]="placeholder()"
      [attr.autocomplete]="autocomplete() || null"
      [attr.inputmode]="inputMode() || null"
      [attr.autocapitalize]="autocapitalize() || null"
      [attr.spellcheck]="spellcheck()"
      [attr.enterkeyhint]="enterKeyHint() || null"
      [attr.maxlength]="maxLength()"
      [attr.min]="min()"
      [attr.max]="max()"
      [attr.step]="step()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [required]="required()"
      [readOnly]="readOnly()"
      [disabled]="disabled() || formDisabled()"
      [value]="value() ?? currentValue() ?? ''"
      [class.is-invalid]="invalid()"
      [class.is-valid]="valid() && !invalid()"
      [class]="controlClass()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GigsawInputComponent), multi: true }],
  styles: [':host { display: contents; } :host(.ng-invalid.ng-touched) .input { border-color: var(--color-error); }'],
})
export class GigsawInputComponent implements ControlValueAccessor {
  readonly type = input('text');
  readonly id = input('');
  readonly name = input('');
  readonly tabIndex = input<number | string | null>(null, { alias: 'tabindex' });
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly inputMode = input('');
  readonly autocapitalize = input('');
  readonly spellcheck = input<boolean | null>(null);
  readonly enterKeyHint = input('');
  readonly maxLength = input<number | null>(null);
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);
  readonly step = input<number | string | null>(null);
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaDescribedBy = input('', { alias: 'aria-describedby' });
  readonly required = input(false);
  readonly readOnly = input(false, { alias: 'readonly' });
  readonly value = input<string | number | null>();
  readonly controlClass = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly valueChange = output<string | number | null>();
  readonly blurred = output<void>();

  readonly currentValue = signal<string | number | null>('');
  readonly formDisabled = signal(false);

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.currentValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = this.type() === 'number' ? (target.value === '' ? null : target.valueAsNumber) : target.value;
    this.currentValue.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }
}
