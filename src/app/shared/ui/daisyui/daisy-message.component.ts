import { Component, input } from '@angular/core';

type DaisyMessageTone = 'info' | 'success' | 'warning' | 'error' | 'muted';

@Component({
  selector: 'app-daisy-message',
  standalone: true,
  template: `
    <p
      class="text-sm {{ messageClass() }}"
      [class.text-info]="tone() === 'info'"
      [class.text-success]="tone() === 'success'"
      [class.text-warning]="tone() === 'warning'"
      [class.text-error]="tone() === 'error'"
      [class.text-base-content]="tone() === 'muted'"
    >
      <ng-content />
    </p>
  `,
})
export class DaisyMessageComponent {
  readonly tone = input<DaisyMessageTone>('muted');
  readonly messageClass = input('');
}
