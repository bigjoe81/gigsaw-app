import { NativeUiModule } from '../native-ui';
import { Component, input } from '@angular/core';
@Component({selector:'app-gigsaw-message',standalone:true,imports: [NativeUiModule],template:`<small [class]="'text-sm ' + (tone() === 'muted' ? 'text-base-content/60' : 'text-' + tone()) + ' ' + messageClass()"><ng-content /></small>`})
export class GigsawMessageComponent { readonly tone=input<'info'|'success'|'warning'|'error'|'muted'>('muted'); readonly messageClass=input(''); }
