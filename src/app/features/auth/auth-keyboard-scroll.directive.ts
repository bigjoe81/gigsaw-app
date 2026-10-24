import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
/** Safari can shrink only the visual viewport when the keyboard opens. */
@Directive({
  selector: '.app-content[appAuthKeyboardScroll]',
  standalone: true,
})
export class AuthKeyboardScrollDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly viewport = window.visualViewport;
  private focusedField: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  private readonly onFocus = (event: Event): void => {
    const field = event.target;
    if (field instanceof HTMLElement && field.matches('.input, .textarea, input, textarea')) {
      this.focusedField = field;
      // Give the keyboard animation time to finish.
      this.schedule(400);
    }
  };

  private readonly onViewportChange = (): void => this.schedule(120);

  ngAfterViewInit(): void {
    this.host.addEventListener('focusin', this.onFocus);
    this.host.addEventListener('focusout', this.onViewportChange);
    this.viewport?.addEventListener('resize', this.onViewportChange);
    this.viewport?.addEventListener('scroll', this.onViewportChange);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.timer);
    this.host.removeEventListener('focusin', this.onFocus);
    this.host.removeEventListener('focusout', this.onViewportChange);
    this.viewport?.removeEventListener('resize', this.onViewportChange);
    this.viewport?.removeEventListener('scroll', this.onViewportChange);
    this.reset();
  }

  private schedule(delay: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.keepFieldVisible(), delay);
  }

  private reset(): void {
    this.host.style.removeProperty('--auth-keyboard-inset');
    this.host.classList.remove('auth-keyboard-open');
  }

  private async keepFieldVisible(): Promise<void> {
    const viewport = this.viewport;
    const field = this.focusedField;
    if (!viewport || viewport.scale !== 1 || !field?.matches(':focus-within') ||
        !this.host.isConnected) {
      this.reset();
      return;
    }

    // Ignore browser chrome changes and leave resized native WebViews to the browser.
    const viewportBottom = viewport.offsetTop + viewport.height;
    const obscuredHeight = Math.max(0, this.host.getBoundingClientRect().bottom - viewportBottom);
    if (obscuredHeight < 120) {
      this.reset();
      return;
    }

    this.host.style.setProperty('--auth-keyboard-inset', `${obscuredHeight}px`);
    this.host.classList.add('auth-keyboard-open');
    const scroll = this.host;
    if (this.destroyed || this.focusedField !== field || !field.matches(':focus-within') ||
        !this.host.isConnected) {
      return;
    }

    const fieldBounds = field.getBoundingClientRect();
    const visibleTop = Math.max(viewport.offsetTop, this.host.getBoundingClientRect().top) + 24;
    const visibleBottom = viewportBottom - 24;
    const delta = fieldBounds.bottom > visibleBottom
      ? fieldBounds.bottom - visibleBottom
      : Math.min(0, fieldBounds.top - visibleTop);
    if (Math.abs(delta) > 1) {
      // No animation: viewport scroll events must not start competing animations.
      scroll.scrollTo(0, Math.max(0, scroll.scrollTop + delta));
    }
  }
}
