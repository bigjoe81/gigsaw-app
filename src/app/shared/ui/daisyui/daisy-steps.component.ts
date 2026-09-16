import { Component, input } from '@angular/core';

export interface DaisyStepItem {
  label: string;
  active?: boolean;
}

@Component({
  selector: 'app-daisy-steps',
  standalone: true,
  template: `
    <ul class="pl-0 w-full steps {{ stepsClass() }}" [class.steps-horizontal]="horizontal()" [class.steps-vertical]="!horizontal()" [attr.aria-label]="ariaLabel()">
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
