import {
  AfterViewInit,
  booleanAttribute,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';

type GigsawButtonTone = 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error' | 'unstyled';
type GigsawButtonType = 'button' | 'submit' | 'reset';

const NON_FORWARDED_ATTRIBUTES = new Set([
  'slot',
  'appback',
  'defaulthref',
  'tone',
  'type',
  'outline',
  'disabled',
  'loading',
  'buttonclass',
  'aria-busy',
]);
const BUTTON_MANAGED_ATTRIBUTES = new Set(['class', 'type', 'disabled', 'aria-busy']);

@Component({
  selector: 'app-gigsaw-button',
  standalone: true,
  template: `
    <button
      #button
      [class]="buttonClasses()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) {
        <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [':host { display: contents; }'],
})
export class GigsawButtonComponent implements AfterViewInit, OnDestroy {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly buttonElement = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  private mutationObserver?: MutationObserver;

  readonly tone = input<GigsawButtonTone>('default');
  readonly type = input<GigsawButtonType>('button');
  readonly outline = input(false, { transform: booleanAttribute });
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly buttonClass = input('');

  buttonClasses(): string {
    const tone = this.tone();
    const classes = [
      ...(tone === 'unstyled' ? [] : ['btn', `btn-${tone === 'default' ? 'primary' : tone}`]),
      this.buttonClass(),
      this.outline() ? 'btn-outline' : '',
      this.hostElement.className,
    ];

    return [...new Set(classes.flatMap((value) => value.split(/\s+/)).filter(Boolean))].join(' ');
  }

  ngAfterViewInit(): void {
    this.syncHostAttributesToButton();
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.syncHostAttributesToButton());
      this.mutationObserver.observe(this.hostElement, { attributes: true });
    }
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  private syncHostAttributesToButton(): void {
    const button = this.buttonElement().nativeElement;
    const forwardedAttributes = this.getForwardedHostAttributes();

    this.removeStaleForwardedAttributes(button, forwardedAttributes);
    this.applyForwardedAttributes(button, forwardedAttributes);
    button.className = this.buttonClasses();
  }

  private removeStaleForwardedAttributes(
    button: HTMLButtonElement,
    forwardedAttributes: Map<string, string>,
  ): void {
    for (const { name } of Array.from(button.attributes)) {
      if (BUTTON_MANAGED_ATTRIBUTES.has(name) || forwardedAttributes.has(name)) continue;
      button.removeAttribute(name);
    }
  }

  private applyForwardedAttributes(
    button: HTMLButtonElement,
    forwardedAttributes: Map<string, string>,
  ): void {
    for (const [name, value] of forwardedAttributes) {
      button.setAttribute(name, value);
    }
  }

  private getForwardedHostAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();
    for (const { name, value } of Array.from(this.hostElement.attributes)) {
      if (this.shouldForwardAttribute(name)) attributes.set(name, value);
    }
    return attributes;
  }

  private shouldForwardAttribute(name: string): boolean {
    const normalizedName = name.toLowerCase();

    if (NON_FORWARDED_ATTRIBUTES.has(normalizedName)) return false;
    if (normalizedName === 'class' || normalizedName === 'ng-version') return false;
    if (normalizedName.startsWith('_ng') || normalizedName.startsWith('ng-reflect-')) return false;
    return true;
  }
}
