import { Component, input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
@Component({ selector: 'app-gigsaw-loading', standalone: true, imports: [IonSpinner], template: `<ion-spinner name="crescent" aria-label="Caricamento" />` })
export class GigsawLoadingComponent {
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md'); readonly loadingClass = input('');
}
