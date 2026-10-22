import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-gigsaw-list',
  standalone: true,
  imports: [NativeUiModule],
  host: { '[class]': 'listClass()' },
  template: `
    <div class="ui-list grid gap-2" [attr.aria-label]="ariaLabel() || heading() || null">
      <ng-content />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ui-list { display: grid; gap: 10px; padding: 0; background: transparent; }
  `],
})
export class GigsawListComponent {
  readonly heading = input('');
  readonly ariaLabel = input('');
  readonly surface = input(true);
  readonly shadow = input(false);
  readonly listClass = input('');
}

@Component({
  selector: 'app-gigsaw-list-item, [app-gigsaw-list-item]',
  standalone: true,
  imports: [],
  host: { '[class]': 'itemClass()', '[attr.role]': "interactive() ? 'button' : null", '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null', '(keydown)': 'handleKeydown($event)' },
  template: `
    <div class="ui-item flex items-center gap-3 py-3"


      [attr.aria-disabled]="disabled()"

      (click)="activate()">
      <ng-content />
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .ui-item {
      width: 100%;
      --inner-border-width: 0;
      --background-hover-opacity: 0;
    }
    @media (hover: hover) {
      :host(:hover) .ui-item:not(.item-disabled) {
        background: var(--gigsaw-list-hover-background, #2a3648);
      }
    }
  `],
})
export class GigsawListItemComponent {
  readonly itemClass = input('');
  readonly interactive = input(false);
  readonly disabled = input(false);
  readonly selected = output<void>();

  handleKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); this.activate();
  }

  activate(): void {
    if (this.interactive() && !this.disabled()) this.selected.emit();
  }
}
