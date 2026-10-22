import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input, viewChild } from '@angular/core';
type GigsawButtonTone = 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error' | 'unstyled';
type GigsawButtonType = 'button' | 'submit' | 'reset';
@Component({
  selector: 'app-gigsaw-button',
  standalone: true,
  template: `<button #button [class]="buttonClasses()" [type]="type()" [disabled]="disabled() || loading()" [attr.aria-busy]="loading()">@if(loading()){<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>}<ng-content /></button>`,
  styles: [':host { display: contents; }'],
})
export class GigsawButtonComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  private observer?: MutationObserver;

  readonly tone = input<GigsawButtonTone>('default');
  readonly type = input<GigsawButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly buttonClass = input('');

  buttonClasses(): string {
    const componentClasses = this.tone() === 'unstyled'
      ? this.buttonClass()
      : `btn btn-${this.tone() === 'default' ? 'primary' : this.tone()} ${this.buttonClass()}`;
    return Array.from(new Set(
      [componentClasses, ...Array.from(this.host.classList)].flatMap(classes => classes.split(/\s+/)).filter(Boolean),
    )).join(' ');
  }

  ngAfterViewInit(): void {
    this.syncHostAttributes();
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => this.syncHostAttributes());
      this.observer.observe(this.host, { attributes: true });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private syncHostAttributes(): void {
    const button = this.button().nativeElement;
    const excluded = new Set(['slot', 'appback', 'defaulthref', 'tone', 'type', 'disabled', 'loading', 'buttonclass', 'aria-busy']);
    const hostAttributes = new Map(
      Array.from(this.host.attributes)
        .filter(({ name }) => !excluded.has(name.toLowerCase()) && name !== 'class')
        .map(({ name, value }) => [name, value]),
    );

    for (const attribute of Array.from(button.attributes)) {
      if (attribute.name === 'class' || attribute.name === 'type' || attribute.name === 'disabled' || attribute.name === 'aria-busy') continue;
      if (!hostAttributes.has(attribute.name)) button.removeAttribute(attribute.name);
    }
    for (const [name, value] of hostAttributes) button.setAttribute(name, value);

    button.className = this.buttonClasses();
  }

}
