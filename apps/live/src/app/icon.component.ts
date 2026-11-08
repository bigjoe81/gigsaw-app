import { Component, Input } from '@angular/core';

@Component({
  selector: 'live-icon',
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="paths[name] || paths['music']" />
  </svg>`,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class IconComponent {
  @Input() name = 'music';
  readonly paths: Record<string, string> = {
    home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
    folder: 'M3 5h6l2 3h10v12H3Z',
    kit: 'M8 7V4h8v3M3 7h18v14H3ZM3 12h18M10 12v3h4v-3',
    mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
    stage: 'M3 21V4h18v17M1 4h22M6 4l-2 7h5L7 4m10 0-2 7h5l-2-7M9 21v-5h6v5',
    calendar: 'M4 5h16v16H4ZM8 2v6m8-6v6M4 11h16',
    people:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-8a4 4 0 0 1 0 8',
    check: 'm5 12 4 4L19 6',
    left: 'm15 5-7 7 7 7',
    right: 'm9 5 7 7-7 7',
    close: 'm6 6 12 12M6 18 18 6',
    music:
      'M9 18V5l11-2v13M9 8l11-2M9 18c0 4-6 4-6 1s6-4 6-1m11-2c0 4-6 4-6 1s6-4 6-1',
    note: 'M4 4h16v12H9l-5 4ZM8 8h8m-8 4h5',
    bookmark: 'M6 3h12v19l-6-4-6 4Z',
    file: 'M5 3h9l5 5v13H5ZM14 3v6h5',
  };
}
