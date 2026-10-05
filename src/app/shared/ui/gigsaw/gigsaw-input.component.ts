import { Component, input, output } from '@angular/core';
import { IonInput } from '@ionic/angular/standalone';
@Component({ selector: 'app-gigsaw-input', standalone: true, imports: [IonInput], template: `
  <ion-input fill="outline" [type]="type()" [name]="name()" [placeholder]="placeholder()" [autocomplete]="autocomplete()" [inputmode]="inputMode() || undefined" [maxlength]="maxLength()" [disabled]="disabled()" [value]="value()" [class.ion-invalid]="invalid()" [class.ion-valid]="valid() && !invalid()" [class.ion-touched]="invalid() || valid()" (ionInput)="valueChange.emit($event.detail.value ?? '')" (ionBlur)="blurred.emit()" />
` })
export class GigsawInputComponent {
  readonly type = input('text'); readonly name = input(''); readonly placeholder = input(''); readonly autocomplete = input(''); readonly inputMode = input(''); readonly maxLength = input<number | null>(null); readonly controlClass = input(''); readonly value = input(''); readonly disabled = input(false); readonly valid = input(false); readonly invalid = input(false);
  readonly valueChange = output<string>(); readonly blurred = output<void>();
}
