import { Component, input } from '@angular/core';

export interface DaisyStepItem {
  label: string;
  active?: boolean;
}

@Component({
  selector: 'app-daisy-steps',
  standalone: true,
  template: `
    <ul class="steps {{ stepsClass() }}" [class.steps-horizontal]="horizontal()" [attr.aria-label]="ariaLabel()">
      @for (step of steps(); track step.label) {
        <li class="step" [class.step-primary]="step.active">{{ step.label }}</li>
      }
    </ul>
  `,
})
export class DaisyStepsComponent {
  readonly steps = input<DaisyStepItem[]>([]);
  readonly horizontal = input(true);
  readonly ariaLabel = input('');
  readonly stepsClass = input('');
}
