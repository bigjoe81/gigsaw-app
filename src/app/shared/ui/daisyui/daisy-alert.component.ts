import { Component, input } from '@angular/core';

type DaisyAlertTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-daisy-alert',
  standalone: true,
  template: `
    <div
      class="alert {{ alertClass() }}"
      role="alert"
      [class.alert-info]="tone() === 'info'"
      [class.alert-success]="tone() === 'success'"
      [class.alert-warning]="tone() === 'warning'"
      [class.alert-error]="tone() === 'error'"
    >
      <span class="text-sm font-medium"><ng-content /></span>
    </div>
  `,
})
export class DaisyAlertComponent {
  readonly tone = input<DaisyAlertTone>('info');
  readonly alertClass = input('');
}
