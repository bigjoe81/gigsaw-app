import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-gigsaw-icon',
  standalone: true,
  imports: [FaIconComponent],
  template: `<fa-icon [icon]="icon()" [title]="label()" />`,
  styles: `
    :host { display: inline-flex; align-items: center; justify-content: center; color: inherit; vertical-align: middle; }
    :host([slot="start"]) { margin-inline-end: .5em; }
    :host([slot="end"]) { margin-inline-start: .5em; }
    fa-icon { display: inline-flex; }
  `,
})
export class GigsawIconComponent {
  readonly icon = input.required<IconDefinition>();
  readonly label = input<string>();
}
