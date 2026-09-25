import { AfterViewInit, Component, ElementRef, input, output, viewChildren } from '@angular/core';

@Component({
  selector: 'app-daisy-otp-input',
  standalone: true,
  template: `
    <div class="otp-grid" role="group" [attr.aria-label]="label()">
      @for (digit of digits; track $index) {
        <input
          #digitInput
          class="gigsaw-control input otp-cell border border-solid bg-[#0f172a] text-[#e5edf7] focus:outline-none"
          [class.input-error]="invalid()"
          [class.input-success]="valid() && !invalid()"
          [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : 'var(--gigsaw-input-border)'"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          [attr.aria-label]="label() + ' cifra ' + ($index + 1)"
          [disabled]="disabled()"
          [value]="digit"
          (input)="onInput($event, $index)"
          (keydown)="onKeydown($event, $index)"
          (paste)="onPaste($event)"
        />
      }
    </div>
  `,
  styles: [`
    .otp-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      width: 100%;
    }

    .otp-cell {
      width: 100%;
      min-width: 0;
      height: 52px;
      padding: 0;
      text-align: center;
      font-size: 1.35rem;
      font-weight: 800;
      line-height: 1;
      caret-color: var(--color-primary, currentColor);
    }

    .otp-cell:focus {
      background-color: #18243a !important;
    }

    @media (max-width: 360px) {
      .otp-grid {
        gap: 6px;
      }

      .otp-cell {
        height: 48px;
        font-size: 1.15rem;
      }
    }
  `],
})
export class DaisyOtpInputComponent implements AfterViewInit {
  readonly value = input('');
  readonly disabled = input(false);
  readonly label = input('Codice OTP');
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly valueChange = output<string>();
  readonly complete = output<string>();
  readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

  digits = Array.from({ length: 6 }, (_, index) => this.value().replace(/\D/g, '').slice(0, 6)[index] ?? '');

  ngAfterViewInit(): void {
    this.syncDigits(this.value());
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      this.applyValue(value);
      this.focusFirstEmptyOrLast();
      return;
    }

    this.digits[index] = value;
    this.emitValue();

    if (value) {
      this.focus(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      event.preventDefault();
      this.digits[index - 1] = '';
      this.emitValue();
      this.focus(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focus(index - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focus(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    const value = event.clipboardData?.getData('text') ?? '';
    const digits = value.replace(/\D/g, '').slice(0, 6);

    if (!digits) return;

    event.preventDefault();
    this.applyValue(digits);
    this.focusFirstEmptyOrLast();
  }

  private applyValue(value: string): void {
    this.syncDigits(value);
    this.emitValue();
  }

  private syncDigits(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    this.digits = Array.from({ length: 6 }, (_, index) => digits[index] ?? '');
  }

  private emitValue(): void {
    const value = this.digits.join('');
    this.valueChange.emit(value);

    if (value.length === 6) {
      this.complete.emit(value);
    }
  }

  private focusFirstEmptyOrLast(): void {
    const emptyIndex = this.digits.findIndex((digit) => !digit);
    this.focus(emptyIndex === -1 ? 5 : emptyIndex);
  }

  private focus(index: number): void {
    const inputs = this.digitInputs();
    const input = inputs[Math.max(0, Math.min(index, inputs.length - 1))]?.nativeElement;
    input?.focus();
    input?.select();
  }
}
