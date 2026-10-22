import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';
@Component({selector:'app-gigsaw-checkbox',standalone:true,imports: [NativeUiModule],template:`<input class="checkbox checkbox-primary" [checked]="checked()" [disabled]="disabled()" (change)="checkedChange.emit($any($event.target).checked)" (blur)="blurred.emit()"  type="checkbox" [class]="controlClass()" />`})
export class GigsawCheckboxComponent { readonly controlClass=input(''); readonly checked=input(false); readonly disabled=input(false); readonly valid=input(false); readonly invalid=input(false); readonly checkedChange=output<boolean>(); readonly blurred=output<void>(); }
