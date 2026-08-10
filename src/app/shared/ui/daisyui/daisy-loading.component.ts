import { Component, input } from '@angular/core';

type DaisyLoadingSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-daisy-loading',
  standalone: true,
  template: `
    <span
      class="loading loading-spinner {{ loadingClass() }}"
      [class.loading-xs]="size() === 'xs'"
      [class.loading-sm]="size() === 'sm'"
      [class.loading-md]="size() === 'md'"
      [class.loading-lg]="size() === 'lg'"
      aria-hidden="true"
    ></span>
  `,
})
export class DaisyLoadingComponent {
  readonly size = input<DaisyLoadingSize>('md');
  readonly loadingClass = input('');
}
