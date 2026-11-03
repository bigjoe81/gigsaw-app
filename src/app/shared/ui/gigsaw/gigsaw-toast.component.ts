import { Component, input } from '@angular/core';

export type GigsawToastTone = 'info' | 'success' | 'warning' | 'error';
export type GigsawToastPosition =
  | 'top'
  | 'middle'
  | 'bottom'
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

@Component({
  selector: 'app-gigsaw-toast',
  standalone: true,
  template: `
    <div [class]="'toast toast-' + verticalPosition() + ' toast-' + horizontalPosition() + ' z-[1000]'">
      <div
        [class]="'alert alert-' + tone()"
        [attr.role]="tone() === 'error' || tone() === 'warning' ? 'alert' : 'status'"
        [attr.aria-live]="tone() === 'error' || tone() === 'warning' ? 'assertive' : 'polite'"
      >
        {{ message() }}
      </div>
    </div>
  `,
  styles: [':host { display: contents; }'],
})
export class GigsawToastComponent {
  readonly message = input.required<string>();
  readonly tone = input<GigsawToastTone>('info');
  readonly position = input<GigsawToastPosition>('bottom-end');

  verticalPosition(): string {
    return this.position().split('-')[0];
  }

  horizontalPosition(): string {
    return this.position().split('-')[1] ?? 'end';
  }
}
