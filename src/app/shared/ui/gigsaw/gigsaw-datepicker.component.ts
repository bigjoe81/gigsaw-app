import { Component, input, output } from '@angular/core';
import { IonInput } from '@ionic/angular/standalone';
@Component({selector:'app-gigsaw-datepicker',standalone:true,imports:[IonInput],template:`<ion-input type="date" fill="outline" [name]="name()" [value]="value()" [disabled]="disabled()" [class.ion-invalid]="invalid()" [class.ion-touched]="invalid()" (ionChange)="valueChange.emit($event.detail.value ?? '')" (ionBlur)="blurred.emit()" />`})
export class GigsawDatepickerComponent { readonly name=input(''); readonly placeholder=input('Seleziona una data'); readonly controlClass=input(''); readonly value=input(''); readonly disabled=input(false); readonly valid=input(false); readonly invalid=input(false); readonly valueChange=output<string>(); readonly blurred=output<void>(); }
