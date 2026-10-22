import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';
@Component({ selector: 'app-gigsaw-input', standalone: true, imports: [NativeUiModule], template: `
  <input class="input w-full" [type]="type()" [name]="name()" [placeholder]="placeholder()" [attr.autocomplete]="autocomplete()" [attr.inputmode]="inputMode() || undefined" [attr.maxlength]="maxLength()" [disabled]="disabled()" [value]="value()" [class.is-invalid]="invalid()" [class.is-valid]="valid() && !invalid()" [class.is-touched]="invalid() || valid()" (input)="valueChange.emit($any($event.target).value ?? '')" (blur)="blurred.emit()"  [class]="controlClass()" />
` })
export class GigsawInputComponent {
  readonly type = input('text'); readonly name = input(''); readonly placeholder = input(''); readonly autocomplete = input(''); readonly inputMode = input(''); readonly maxLength = input<number | null>(null); readonly controlClass = input(''); readonly value = input(''); readonly disabled = input(false); readonly valid = input(false); readonly invalid = input(false);
  readonly valueChange = output<string>(); readonly blurred = output<void>();
}
