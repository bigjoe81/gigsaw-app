import { Component, input } from '@angular/core';
import { IonCard, IonCardContent, IonText } from '@ionic/angular/standalone';
@Component({selector:'app-gigsaw-alert',standalone:true,imports:[IonCard,IonCardContent,IonText],template:`<ion-card role="alert"><ion-card-content><ion-text [color]="tone() === 'error' ? 'danger' : tone()"><ng-content /></ion-text></ion-card-content></ion-card>`})
export class GigsawAlertComponent { readonly tone=input<'info'|'success'|'warning'|'error'>('info'); readonly alertClass=input(''); }
