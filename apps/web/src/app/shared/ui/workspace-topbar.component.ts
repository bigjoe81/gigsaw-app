import { Component, Input } from '@angular/core';
import { NativeUiModule } from './native-ui';
@Component({
  selector: 'app-workspace-topbar',
  standalone: true,
  imports: [NativeUiModule],
  template: `<header class="workspace-topbar">
    <button
      class="btn btn-ghost btn-square"
      data-menu-toggle
      type="button"
      aria-label="Apri navigazione"
    >
      <app-symbol name="bars" />
    </button>
    <span>La tua band</span><span aria-hidden="true">/</span
    ><strong>{{ section }}</strong>
    @if (detail) {
      <span aria-hidden="true">/</span><strong>{{ detail }}</strong>
    }
  </header>`,
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
    }
  `,
})
export class WorkspaceTopbarComponent {
  @Input({ required: true }) section = '';
  @Input() detail = '';
}
