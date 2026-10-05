import { Component, input, output } from '@angular/core';
import { IonItem, IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gigsaw-list',
  standalone: true,
  imports: [IonList],
  host: { '[class]': 'listClass()' },
  template: `
    <ion-list [attr.aria-label]="ariaLabel() || heading() || null">
      <ng-content />
    </ion-list>
  `,
  styles: [`
    :host { display: block; }
    ion-list { display: grid; gap: 10px; padding: 0; background: transparent; }
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
  imports: [IonItem],
  host: { '[class]': 'itemClass()' },
  template: `
    <ion-item
      lines="none"
      [button]="interactive()"
      [disabled]="disabled()"
      [detail]="interactive()"
      (click)="activate()">
      <ng-content />
    </ion-item>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    ion-item {
      width: 100%;
      --inner-border-width: 0;
      --background-hover-opacity: 0;
    }
    @media (hover: hover) {
      :host(:hover) ion-item:not(.item-disabled) {
        --background: var(--gigsaw-list-hover-background, #2a3648);
      }
    }
  `],
})
export class GigsawListItemComponent {
  readonly itemClass = input('');
  readonly interactive = input(false);
  readonly disabled = input(false);
  readonly selected = output<void>();

  activate(): void {
    if (this.interactive() && !this.disabled()) this.selected.emit();
  }
}
