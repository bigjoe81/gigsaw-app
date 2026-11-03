import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  createComponent,
  inject,
  Injectable,
} from '@angular/core';
import {
  GigsawToastComponent,
  GigsawToastPosition,
  GigsawToastTone,
} from './gigsaw-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly application = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);

  async create(options: {
    message: string;
    duration?: number;
    color?: string;
    tone?: GigsawToastTone;
    position?: GigsawToastPosition;
  }): Promise<{ present: () => Promise<void>; dismiss: () => void }> {
    let component: ComponentRef<GigsawToastComponent> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const dismiss = (): void => {
      if (!component) return;
      if (timeoutId) clearTimeout(timeoutId);
      component.location.nativeElement.remove();
      this.application.detachView(component.hostView);
      component.destroy();
      component = undefined;
    };

    return {
      present: async () => {
        if (component) return;

        const host = document.createElement('app-gigsaw-toast');
        component = createComponent(GigsawToastComponent, {
          hostElement: host,
          environmentInjector: this.environment,
        });
        component.setInput('message', options.message);
        component.setInput('tone', options.tone ?? this.toneFromColor(options.color));
        component.setInput('position', options.position ?? 'bottom-end');
        document.body.append(host);
        this.application.attachView(component.hostView);
        component.changeDetectorRef.detectChanges();

        const duration = options.duration ?? 5000;
        if (duration > 0) timeoutId = setTimeout(dismiss, duration);
      },
      dismiss,
    };
  }

  private toneFromColor(color?: string): GigsawToastTone {
    switch (color) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }
}
