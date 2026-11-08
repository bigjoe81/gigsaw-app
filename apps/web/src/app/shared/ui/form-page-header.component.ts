import { NativeUiModule } from './native-ui';
import { WorkspaceTopbarComponent } from './workspace-topbar.component';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  GigsawStepsComponent,
  GigsawStepItem,
} from './gigsaw/gigsaw-steps.component';
export interface FormPageHeaderSection {
  id: number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-page-header',
  standalone: true,
  imports: [NativeUiModule, GigsawStepsComponent, WorkspaceTopbarComponent],
  template: `
    @if (backstage) {
      <app-workspace-topbar [section]="eyebrow" [detail]="title" />
      <div class="backstage-form-heading">
        <div class="workspace-heading">
          <div>
            <h1>{{ title }}</h1>
            <p>{{ subtitle }}</p>
          </div>
          <app-gigsaw-button
            tone="ghost"
            [defaultHref]="backHref"
            appBack
            type="button"
            ><app-symbol name="arrow-back-outline" /> Torna alla
            lista</app-gigsaw-button
          >
        </div>
        <nav class="backstage-steps" [attr.aria-label]="ariaLabel">
          @for (section of sections; track section.id; let index = $index) {
            <button
              type="button"
              [disabled]="section.disabled"
              [attr.aria-current]="section.id === activeSection ? 'step' : null"
              [class.completed]="section.id < activeSection"
              (click)="onSectionChange(section.id)"
            >
              <span>{{ section.id < activeSection ? '✓' : index + 1 }}</span
              >{{ section.label }}
            </button>
          }
        </nav>
      </div>
    } @else {
      <header class="page-header">
        <div class="navbar gap-3">
          <div class="flex items-center gap-2" slot="start">
            <app-gigsaw-button
              tone="unstyled"
              buttonClass="btn btn-ghost btn-square"
              [defaultHref]="backHref"
              aria-label="Torna indietro"
              type="button"
              appBack
              ><app-symbol name="arrow-back-outline"
            /></app-gigsaw-button>
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
    }
  `,
  styles: `
    .backstage-form-heading {
      padding: 28px var(--workspace-gutter) 24px;
      width: 100%;
      max-width: var(--workspace-width);
      margin: auto;
    }
    .backstage-form-heading .workspace-heading {
      margin-bottom: 24px;
    }
    .backstage-steps {
      display: flex;
      gap: 20px;
    }
    .backstage-steps button {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--gigsaw-muted);
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
    }
    .backstage-steps button + button::before {
      content: '';
      width: clamp(16px, 4vw, 80px);
      height: 1px;
      background: var(--gigsaw-border);
      margin-right: 8px;
    }
    .backstage-steps button > span {
      display: grid;
      place-items: center;
      flex: none;
      width: 36px;
      height: 36px;
      border: 1px solid var(--gigsaw-border);
      border-radius: 50%;
    }
    .backstage-steps button[aria-current],
    .backstage-steps .completed {
      color: var(--gigsaw-text);
    }
    .backstage-steps button[aria-current] > span,
    .backstage-steps .completed > span {
      color: var(--gigsaw-on-color);
      background: var(--page-accent);
      border-color: var(--page-accent);
    }
    .backstage-steps button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    @media (max-width: 600px) {
      .backstage-form-heading {
        padding-top: 20px;
      }
      .backstage-form-heading h1 {
        font-size: 1.7rem;
      }
      .backstage-form-heading .workspace-heading {
        gap: 8px;
        margin-bottom: 16px;
      }
      .backstage-steps {
        gap: 12px;
      }
      .backstage-steps button {
        flex: 1;
        flex-direction: column;
        gap: 6px;
        font-size: 0.7rem;
        text-align: center;
      }
      .backstage-steps button + button::before {
        display: none;
      }
    }

    :host(.refined-form-header) {
      display: block;
      flex-shrink: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    :host(.refined-form-header) .page-header {
      box-shadow: none;
    }
    :host(.refined-form-header) .navbar {
      --border-width: 0;
    }
    :host(.refined-form-header) .grow {
      font-family: inherit !important;
      font-weight: 600 !important;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
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
  @Input() backstage = false;
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
