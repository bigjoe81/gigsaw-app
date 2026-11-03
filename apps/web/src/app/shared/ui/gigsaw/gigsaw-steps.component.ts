import { Component, input, output } from '@angular/core';

export interface GigsawStepItem {
  label: string;
  active?: boolean;
  current?: boolean;
  disabled?: boolean;
  value?: number | string;
}

@Component({
  selector: 'app-gigsaw-steps',
  standalone: true,
  template: `
    <ul
      [class]="'steps ' + (horizontal() ? 'steps-horizontal' : 'steps-vertical') + ' ' + stepsClass()"
      [attr.aria-label]="ariaLabel() || null"
    >
      @for (step of steps(); track step.value ?? step.label; let index = $index) {
        <li
          class="step"
          [class.step-primary]="step.active"
          [attr.aria-current]="step.current ? 'step' : null"
          [attr.aria-disabled]="selectable() && step.disabled ? 'true' : null"
          [attr.role]="selectable() ? 'button' : null"
          [attr.tabindex]="selectable() && !step.disabled ? 0 : null"
          (click)="select(step, index)"
          (keydown)="onKeydown($event, step, index)"
        >{{ step.label }}</li>
      }
    </ul>
  `,
  styles: `
    .refined-form-steps {
      width: 100%;
      overflow-x: auto;
    }
    .refined-form-steps .step {
      min-width: 0;
      color: var(--gigsaw-muted);
      font-size: .82rem;
    }
    .refined-form-steps .step-primary {
      color: var(--gigsaw-text);
    }
    .refined-form-steps[role] .step,
    .refined-form-steps .step[role="button"] {
      cursor: pointer;
    }
    .refined-form-steps .step[role="button"]:focus-visible {
      border-radius: 4px;
      outline: 2px solid var(--color-secondary);
      outline-offset: 2px;
    }
    .refined-form-steps .step[aria-disabled="true"] {
      cursor: not-allowed;
      opacity: .55;
    }
  `,
})
export class GigsawStepsComponent {
  readonly steps = input<GigsawStepItem[]>([]);
  readonly horizontal = input(true);
  readonly ariaLabel = input('');
  readonly stepsClass = input('');
  readonly selectable = input(false);
  readonly stepChange = output<number | string>();

  select(step: GigsawStepItem, index: number): void {
    if (!this.selectable() || step.disabled) return;
    this.stepChange.emit(step.value ?? index + 1);
  }

  onKeydown(event: KeyboardEvent, step: GigsawStepItem, index: number): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.select(step, index);
  }
}
