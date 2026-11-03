import { NativeUiModule } from '../native-ui';
import { Component, input } from '@angular/core';
@Component({
    selector: 'app-gigsaw-alert',
    standalone: true, imports: [NativeUiModule],
    template: `<div role="alert" [class]="'alert alert-' + tone() + ' ' + alertClass()"><ng-content /></div>`
})
export class GigsawAlertComponent { readonly tone = input<'info' | 'success' | 'warning' | 'error'>('info'); readonly alertClass = input(''); }
