import { Component } from '@angular/core';
import { IonContent, IonHeader, IonMenuButton, IonButtons, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [IonContent, IonHeader, IonMenuButton, IonButtons, IonTitle, IonToolbar],
  template: '<ion-header><ion-toolbar><ion-buttons slot="start"><ion-menu-button menu="band-menu" /></ion-buttons><ion-title>Impegni</ion-title></ion-toolbar></ion-header><ion-content></ion-content>',
})
export class CommitmentsPlaceholderPage {}
