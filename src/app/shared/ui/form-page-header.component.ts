import { NativeUiModule } from './native-ui';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GigsawStepsComponent, GigsawStepItem } from './gigsaw/gigsaw-steps.component';
export interface FormPageHeaderSection {
  id: number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-page-header',
  standalone: true,
  imports: [NativeUiModule, GigsawStepsComponent],
  template: `
    <header class="page-header">
      <div class="navbar gap-3">
        <div class="flex items-center gap-2" slot="start">
          <app-gigsaw-button tone="unstyled" buttonClass="btn btn-ghost btn-square" [defaultHref]="backHref" aria-label="Torna indietro"  type="button" appBack><app-symbol name="arrow-back-outline" /></app-gigsaw-button>
        </div>
        <h1 class="grow text-xl">{{ title }}</h1>
      </div>

      @if (sections.length > 1) {
        <app-gigsaw-steps
          class="step-navigation"
          [steps]="sectionSteps()"
          [selectable]="true"
          [ariaLabel]="ariaLabel"
          stepsClass="refined-form-steps"
          (stepChange)="onSectionChange($event)"
        />
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
    :host(.refined-form-header) app-gigsaw-steps {
      display: block;
      width: calc(100% - 32px);
      max-width: 520px;
      margin: 4px auto 16px;
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

  sectionSteps(): GigsawStepItem[] {
    return this.sections.map((section) => ({
      label: section.label,
      value: section.id,
      active: section.id <= this.activeSection,
      current: section.id === this.activeSection,
      disabled: section.disabled,
    }));
  }

  onSectionChange(value: string | number | undefined | null): void {
    if (value === undefined || value === null) return;
    const id = Number(value);
    if (Number.isFinite(id)) this.sectionChange.emit(id);
  }
}
