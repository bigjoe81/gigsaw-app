import { NativeUiModule } from '../native-ui';
import { Component, input } from '@angular/core';
type GigsawButtonTone = 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error';
type GigsawButtonType = 'button' | 'submit' | 'reset';
@Component({ selector: 'app-gigsaw-button', standalone: true, imports: [NativeUiModule], template: `<button [class]="'btn ' + (tone() === 'default' ? 'btn-primary' : 'btn-' + tone()) + ' ' + buttonClass()" [type]="type()" [disabled]="disabled() || loading()" [attr.aria-busy]="loading()">@if(loading()){<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>}<ng-content /></button>` })
export class GigsawButtonComponent {
  readonly tone = input<GigsawButtonTone>('default'); readonly type = input<GigsawButtonType>('button'); readonly disabled = input(false); readonly loading = input(false); readonly buttonClass = input('');
}
