import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-daisy-list',
  standalone: true,
  template: `
    <div
      class="list {{ listClass() }}"
      role="list"
      [class.rounded-box]="surface()"
      [class.bg-base-100]="surface()"
      [class.shadow-sm]="surface() && shadow()"
      [attr.aria-label]="ariaLabel() || null"
    >
      @if (heading()) {
        <li class="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
          {{ heading() }}
        </li>
      }
      <ng-content />
    </div>
  `,
})
export class DaisyListComponent {
  readonly heading = input('');
  readonly ariaLabel = input('');
  readonly surface = input(true);
  readonly shadow = input(false);
  readonly listClass = input('');
}

@Component({
  selector: 'app-daisy-list-item, [app-daisy-list-item]',
  standalone: true,
  host: {
    'class': 'list-row',
    '[class]': '"list-row " + itemClass()',
    role: 'listitem',
    '[class.cursor-pointer]': 'interactive()',
    '[class.opacity-50]': 'disabled()',
    '[class.pointer-events-none]': 'disabled()',
    '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '(click)': 'activate()',
    '(keydown.enter)': 'activate()',
    '(keydown.space)': 'activate($event)',
  },
  template: `<ng-content />`,
})
export class DaisyListItemComponent {
  readonly itemClass = input('');
  readonly interactive = input(false);
  readonly disabled = input(false);
  readonly selected = output<void>();

  activate(event?: Event): void {
    if (!this.interactive() || this.disabled()) return;
    event?.preventDefault();
    this.selected.emit();
  }
}
