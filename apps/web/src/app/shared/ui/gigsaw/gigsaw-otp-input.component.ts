import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-gigsaw-otp-input',
  standalone: true,
  imports: [NativeUiModule],
  styles: [`
    .otp {
      --input-color: var(--gigsaw-input-border);
      color: var(--gigsaw-text);
    }

    .otp > span {
      background-color: var(--gigsaw-input-background);
    }

    .otp:focus-within {
      --input-color: var(--color-secondary);
    }

    .otp.otp-success {
      --input-color: var(--color-success);
    }

    .otp.otp-error {
      --input-color: var(--color-error);
    }
  `],
  template: `
    <div class="grid min-w-0 justify-items-center gap-[7px] text-sm font-bold">
      <span>{{ label() }}</span>
      <label
        class="otp otp-md"
        [class.otp-success]="valid() && !invalid()"
        [class.otp-error]="invalid()"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <input
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          pattern="[0-9]{6}"
          required
          [attr.aria-label]="label()"
          [attr.aria-invalid]="invalid()"
          [value]="value()"
          [disabled]="disabled()"
          (input)="onInput($any($event.target).value ?? '')"
        />
      </label>
    </div>
  `,
})
export class GigsawOtpInputComponent {
  readonly value = input('');
  readonly disabled = input(false);
  readonly label = input('Codice OTP');
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly valueChange = output<string>();
  readonly complete = output<string>();

  onInput(raw: string): void {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    this.valueChange.emit(digits);
    if (digits.length === 6) this.complete.emit(digits);
  }
}
