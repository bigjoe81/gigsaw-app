import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/** Safari can shrink only the visual viewport when the keyboard opens. */
@Directive({
  selector: 'ion-content[appAuthKeyboardScroll]',
  standalone: true,
})
export class AuthKeyboardScrollDirective implements AfterViewInit, OnDestroy {
  private readonly content = inject(IonContent);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly viewport = window.visualViewport;
  private focusedField: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  private readonly onFocus = (event: Event): void => {
    const field = event.target;
    if (field instanceof HTMLElement && field.matches('ion-input, ion-textarea, input, textarea')) {
      this.focusedField = field;
      // Give Ionic's scroll assist and the keyboard animation time to finish.
      this.schedule(400);
    }
  };

  private readonly onViewportChange = (): void => this.schedule(120);

  ngAfterViewInit(): void {
    this.host.addEventListener('ionFocus', this.onFocus);
    this.host.addEventListener('focusin', this.onFocus);
    this.host.addEventListener('ionBlur', this.onViewportChange);
    this.host.addEventListener('focusout', this.onViewportChange);
    this.viewport?.addEventListener('resize', this.onViewportChange);
    this.viewport?.addEventListener('scroll', this.onViewportChange);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.timer);
    this.host.removeEventListener('ionFocus', this.onFocus);
    this.host.removeEventListener('focusin', this.onFocus);
    this.host.removeEventListener('ionBlur', this.onViewportChange);
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
        this.host.closest('.ion-page-hidden')) {
      this.reset();
      return;
    }

    // Ignore browser chrome changes and leave resized native WebViews to Ionic.
    const viewportBottom = viewport.offsetTop + viewport.height;
    const obscuredHeight = Math.max(0, this.host.getBoundingClientRect().bottom - viewportBottom);
    if (obscuredHeight < 120) {
      this.reset();
      return;
    }

    this.host.style.setProperty('--auth-keyboard-inset', `${obscuredHeight}px`);
    this.host.classList.add('auth-keyboard-open');
    const scroll = await this.content.getScrollElement();
    if (this.destroyed || this.focusedField !== field || !field.matches(':focus-within') ||
        this.host.closest('.ion-page-hidden')) {
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
      await this.content.scrollToPoint(0, Math.max(0, scroll.scrollTop + delta), 0);
    }
  }
}
