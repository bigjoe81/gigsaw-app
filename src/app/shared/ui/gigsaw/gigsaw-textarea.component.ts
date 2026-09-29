import { Component, input, output } from '@angular/core';
import { IonTextarea } from '@ionic/angular/standalone';
@Component({ selector: 'app-gigsaw-textarea', standalone: true, imports: [IonTextarea], template: `
  <ion-textarea fill="outline" [name]="name()" [placeholder]="placeholder()" [rows]="rows()" [autoGrow]="true" [disabled]="disabled()" [value]="value()" [class.ion-invalid]="invalid()" [class.ion-touched]="invalid()" (ionInput)="valueChange.emit($event.detail.value ?? '')" (ionBlur)="blurred.emit()" />
` })
export class GigsawTextareaComponent {
  readonly name = input(''); readonly placeholder = input(''); readonly rows = input(4); readonly controlClass = input(''); readonly value = input(''); readonly disabled = input(false); readonly valid = input(false); readonly invalid = input(false);
  readonly valueChange = output<string>(); readonly blurred = output<void>();
}
