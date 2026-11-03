import { NativeUiModule } from '../native-ui';
import { Component, input } from '@angular/core';
@Component({ selector: 'app-gigsaw-loading', standalone: true, imports: [NativeUiModule], template: `<span role="status" aria-label="Caricamento" [class]="'loading loading-spinner loading-' + size() + ' ' + loadingClass()"></span>` })
export class GigsawLoadingComponent {
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md'); readonly loadingClass = input('');
}
