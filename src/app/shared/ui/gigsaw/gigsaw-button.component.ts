import { Component, input } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
type GigsawButtonTone = 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error';
type GigsawButtonType = 'button' | 'submit' | 'reset';
@Component({ selector: 'app-gigsaw-button', standalone: true, imports: [IonButton, IonSpinner], template: `
  <ion-button [type]="type()" [color]="tone() === 'error' ? 'danger' : tone() === 'secondary' || tone() === 'accent' ? tone() : 'primary'" [fill]="tone() === 'ghost' ? 'clear' : tone() === 'outline' ? 'outline' : 'solid'" [disabled]="disabled() || loading()">
    @if (loading()) { <ion-spinner name="crescent" /> } <ng-content />
  </ion-button>
` })
export class GigsawButtonComponent {
  readonly tone = input<GigsawButtonTone>('default'); readonly type = input<GigsawButtonType>('button'); readonly disabled = input(false); readonly loading = input(false); readonly buttonClass = input('');
}
