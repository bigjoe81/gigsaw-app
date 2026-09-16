import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output, signal } from '@angular/core';
import IMask from 'imask';

@Component({
  selector: 'app-daisy-time-input',
  standalone: true,
  template: `
    <input
      #timeInput
      class="gigsaw-control input w-full border border-solid border-[#3b5273] bg-[#0f172a] text-[#e5edf7] placeholder:text-[#64748b] focus:outline-none {{ controlClass() }}"
      [class.input-error]="invalid()"
      [class.input-success]="valid() && !invalid()"
      [style.border-color]="invalid() ? 'var(--color-error)' : valid() ? 'var(--color-success)' : '#3b5273'"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="HH:mm"
      [name]="name()"
      [disabled]="disabled()"
      (blur)="onBlur()"
    />
  `,
})
export class DaisyTimeInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('timeInput', { static: true }) private timeInput!: ElementRef<HTMLInputElement>;

  readonly name = input('');
  readonly controlClass = input('');
  readonly value = input('');
  readonly disabled = input(false);
  readonly valid = input(false);
  readonly invalid = input(false);
  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  private readonly ready = signal(false);
  private mask?: ReturnType<typeof IMask>;

  constructor() {
    effect(() => {
      const value = this.value();
      if (this.ready() && value !== this.mask?.value) {
        this.mask!.value = value;
      }
    });
  }

  ngAfterViewInit(): void {
    this.mask = IMask(this.timeInput.nativeElement, {
      mask: 'HH:MM',
      lazy: false,
      overwrite: true,
      autofix: true,
      blocks: {
        HH: { mask: IMask.MaskedRange, from: 0, to: 23, maxLength: 2 },
        MM: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2 },
      },
    });
    this.mask.value = this.value();
    this.mask.on('accept', () => this.valueChange.emit(this.mask!.value));
    this.ready.set(true);
  }

  clearIncompleteValue(): void {
    if (this.mask && !this.mask.masked.isComplete) {
      this.mask.value = '';
      this.valueChange.emit('');
    }
  }

  onBlur(): void {
    this.clearIncompleteValue();
    this.blurred.emit();
  }

  ngOnDestroy(): void {
    this.mask?.destroy();
  }
}
