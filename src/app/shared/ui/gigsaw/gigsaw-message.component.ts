import { Component, input } from '@angular/core';
import { IonNote } from '@ionic/angular/standalone';
@Component({selector:'app-gigsaw-message',standalone:true,imports:[IonNote],template:`<ion-note [color]="tone() === 'error' ? 'danger' : tone() === 'muted' ? 'medium' : tone()"><ng-content /></ion-note>`})
export class GigsawMessageComponent { readonly tone=input<'info'|'success'|'warning'|'error'|'muted'>('muted'); readonly messageClass=input(''); }
