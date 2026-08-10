import { Component, input } from '@angular/core';
import { DaisyLoadingComponent } from './daisy-loading.component';

type DaisyButtonTone = 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error';
type DaisyButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-daisy-button',
  standalone: true,
  imports: [DaisyLoadingComponent],
  template: `
    <button
      class="btn {{ buttonClass() }}"
      [class.btn-primary]="tone() === 'primary'"
      [class.btn-secondary]="tone() === 'secondary'"
      [class.btn-accent]="tone() === 'accent'"
      [class.btn-ghost]="tone() === 'ghost'"
      [class.btn-outline]="tone() === 'outline'"
      [class.btn-error]="tone() === 'error'"
      [type]="type()"
      [disabled]="disabled() || loading()"
    >
      @if (loading()) {
        <app-daisy-loading size="sm" />
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class DaisyButtonComponent {
  readonly tone = input<DaisyButtonTone>('default');
  readonly type = input<DaisyButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly buttonClass = input('');
}
