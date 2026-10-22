import { NativeUiModule } from './native-ui';
import { Component, EventEmitter, Input, Output } from '@angular/core';
export interface FormPageHeaderSection {
  id: number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-page-header',
  standalone: true,
  imports: [NativeUiModule],
  template: `
    <header class="page-header">
      <div class="navbar gap-3">
        <div class="flex items-center gap-2" slot="start">
          <app-gigsaw-button tone="unstyled" buttonClass="btn btn-ghost btn-square" [defaultHref]="backHref" aria-label="Torna indietro"  type="button" appBack>←</app-gigsaw-button>
        </div>
        <h1 class="grow text-xl">{{ title }}</h1>
      </div>

      @if (sections.length > 1) {
        <div class="navbar gap-3">
          <div class="tabs tabs-box"


            [attr.aria-label]="ariaLabel"
            role="tablist">
            @for (section of sections; track section.id) {
              <app-gigsaw-button tone="unstyled" buttonClass="tab" [disabled]="section.disabled ?? false" (click)="onSectionChange(section.id)" [class.tab-active]="activeSection === section.id" [attr.aria-selected]="activeSection === section.id" role="tab" type="button">
                <span class="ui-label">{{ section.label }}</span>
              </app-gigsaw-button>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: `
    :host(.refined-form-header) {
      display: block;
      flex-shrink: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    :host(.refined-form-header) .page-header { box-shadow: none; }
    :host(.refined-form-header) .navbar { --border-width: 0; }
    :host(.refined-form-header) .grow {
      font-family: inherit !important;
      font-weight: 600 !important;
      font-size: 1.1rem;
      letter-spacing: -.02em;
    }
    :host(.refined-form-header) .tabs {
      width: calc(100% - 32px);
      max-width: 520px;
      margin: 4px auto 16px;
      padding: 4px;
      border-radius: 12px;
      background: var(--gigsaw-input-background);
      --background: transparent;
    }
    :host(.refined-form-header) .tab {
      min-height: 36px;
      min-width: 0;
      flex: 1;
      margin: 0;
      text-transform: none;
      letter-spacing: 0;
      font-size: .82rem;
      --color: var(--gigsaw-muted);
      --color-checked: var(--gigsaw-text);
      --indicator-color: #343b46;
      --indicator-height: 100%;
      --indicator-box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
  `,
})
export class FormPageHeaderComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() backHref = '../';
  @Input() sections: FormPageHeaderSection[] = [];
  @Input() activeSection = 1;
  @Input() ariaLabel = 'Sezioni del form';
  @Output() readonly sectionChange = new EventEmitter<number>();

  onSectionChange(value: string | number | undefined | null): void {
    if (value === undefined || value === null) return;
    const id = Number(value);
    if (Number.isFinite(id)) this.sectionChange.emit(id);
  }
}
