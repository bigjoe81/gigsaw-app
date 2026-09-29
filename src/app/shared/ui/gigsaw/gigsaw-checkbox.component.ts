import { Component, input, output } from '@angular/core';
import { IonCheckbox } from '@ionic/angular/standalone';
@Component({selector:'app-gigsaw-checkbox',standalone:true,imports:[IonCheckbox],template:`<ion-checkbox [checked]="checked()" [disabled]="disabled()" (ionChange)="checkedChange.emit($event.detail.checked)" (ionBlur)="blurred.emit()" />`})
export class GigsawCheckboxComponent { readonly controlClass=input(''); readonly checked=input(false); readonly disabled=input(false); readonly valid=input(false); readonly invalid=input(false); readonly checkedChange=output<boolean>(); readonly blurred=output<void>(); }
