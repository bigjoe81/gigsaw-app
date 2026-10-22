import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';
@Component({ selector: 'app-gigsaw-textarea', standalone: true, imports: [NativeUiModule], template: `
  <textarea class="textarea w-full" [name]="name()" [placeholder]="placeholder()" [rows]="rows()" [disabled]="disabled()" [value]="value()" [class.is-invalid]="invalid()" [class.is-valid]="valid() && !invalid()" [class.is-touched]="invalid() || valid()" (input)="valueChange.emit($any($event.target).value ?? '')" (blur)="blurred.emit()"  [class]="controlClass()"></textarea>
` })
export class GigsawTextareaComponent {
  readonly name = input(''); readonly placeholder = input(''); readonly rows = input(4); readonly controlClass = input(''); readonly value = input(''); readonly disabled = input(false); readonly valid = input(false); readonly invalid = input(false);
  readonly valueChange = output<string>(); readonly blurred = output<void>();
}
