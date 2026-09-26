import { Component, input, output } from '@angular/core';

export type DaisyBadgeTone = 'default' | 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
export type DaisyBadgeStyle = 'solid' | 'outline' | 'soft' | 'ghost';
export type DaisyBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-daisy-badge',
  standalone: true,
  template: `
    <span
      class="badge gap-1.5 {{ badgeClass() }}"
      [class.badge-neutral]="tone() === 'neutral'"
      [class.badge-primary]="tone() === 'primary'"
      [class.badge-secondary]="tone() === 'secondary'"
      [class.badge-accent]="tone() === 'accent'"
      [class.badge-info]="tone() === 'info'"
      [class.badge-success]="tone() === 'success'"
      [class.badge-warning]="tone() === 'warning'"
      [class.badge-error]="tone() === 'error'"
      [class.badge-outline]="appearance() === 'outline'"
      [class.badge-soft]="appearance() === 'soft'"
      [class.badge-ghost]="appearance() === 'ghost'"
      [class.badge-xs]="size() === 'xs'"
      [class.badge-sm]="size() === 'sm'"
      [class.badge-md]="size() === 'md'"
      [class.badge-lg]="size() === 'lg'"
      [class.badge-xl]="size() === 'xl'"
    >
      <ng-content />
      @if (dismissible()) {
        <button
          type="button"
          class="-mr-1 inline-grid size-5 shrink-0 place-items-center rounded-full opacity-70 transition hover:bg-current/10 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          [attr.aria-label]="dismissLabel()"
          (click)="dismissed.emit()"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      }
    </span>
  `,
})
export class DaisyBadgeComponent {
  readonly tone = input<DaisyBadgeTone>('default');
  readonly appearance = input<DaisyBadgeStyle>('solid');
  readonly size = input<DaisyBadgeSize>('md');
  readonly dismissible = input(false);
  readonly dismissLabel = input('Rimuovi');
  readonly badgeClass = input('');

  readonly dismissed = output<void>();
}
