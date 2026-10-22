import { AfterContentInit, AfterViewChecked, AfterViewInit, Component, ContentChild, Directive, ElementRef, EventEmitter, HostListener, Injectable, Input, NgModule, OnChanges, OnDestroy, Output, TemplateRef, ViewChild, ApplicationRef, EnvironmentInjector, Type, createComponent, inject } from '@angular/core';
import { NgTemplateOutlet, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { symbolRegistry } from './symbol-registry';

@Component({
  selector: 'app-symbol',
  template: `<span [innerHTML]="svg" aria-hidden="true"></span>`,
  styles: `:host{display:inline-flex;vertical-align:middle;width:1.25em;height:1.25em;flex-shrink:0}:host span{display:contents}:host ::ng-deep svg{width:100%;height:100%;fill:currentColor}:host ::ng-deep .ionicon-fill-none{fill:none}:host ::ng-deep .ionicon-stroke-width{stroke-width:32px}:host ::ng-deep [stroke-linecap]{stroke:currentColor}`,
})
export class SymbolComponent implements OnChanges {
  @Input() name = '';
  @Input() icon = '';
  private readonly sanitizer = inject(DomSanitizer);
  svg: SafeHtml = '';
  ngOnChanges(): void {
    const key = this.name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    // Only bundled icon definitions are trusted; never render caller-provided HTML.
    const source = this.icon && Object.values(symbolRegistry).includes(this.icon) ? this.icon : symbolRegistry[key];
    this.svg = this.sanitizer.bypassSecurityTrustHtml(source ?? symbolRegistry['helpCircleOutline'] ?? '');
  }
}

@Directive({ selector: 'button[appBack]' })
export class BackDirective {
  @Input() defaultHref = '/band';
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  @HostListener('click') back(): void {
    if (window.history.state?.navigationId > 1) this.location.back();
    else void this.router.navigateByUrl(this.router.createUrlTree([this.defaultHref], { relativeTo: this.route }));
  }
}

@Directive({ selector: 'select[appSelect]' })
export class SelectDirective implements OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() appSelectValue: unknown;
  @Output() selectionChange = new EventEmitter<any>();
  private readonly select = inject<ElementRef<HTMLSelectElement>>(ElementRef).nativeElement;
  private readonly observer = new MutationObserver(() => this.sync());
  ngOnChanges(): void { this.sync(); }
  ngAfterViewInit(): void { this.observer.observe(this.select, { childList: true, subtree: true }); this.sync(); }
  ngAfterViewChecked(): void { this.sync(); }
  ngOnDestroy(): void { this.observer.disconnect(); }
  private sync(): void {
    const values = Array.isArray(this.appSelectValue) ? this.appSelectValue.map(String) : [String(this.appSelectValue ?? '')];
    for (const option of Array.from(this.select.options)) option.selected = values.includes(option.value);
  }
  @HostListener('change') change(): void {
    this.selectionChange.emit(this.select.multiple ? Array.from(this.select.selectedOptions, option => option.value) : this.select.value);
  }
}

export interface ReorderEvent { detail: { from: number; to: number; complete: () => void } }
@Directive({ selector: '[appReorder]' })
export class ReorderDirective implements AfterContentInit, OnDestroy {
  @Output() itemsReordered = new EventEmitter<ReorderEvent>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly observer = new MutationObserver(() => this.decorate());
  private from = -1;
  ngAfterContentInit(): void { this.decorate(); this.observer.observe(this.host, { childList: true }); }
  ngOnDestroy(): void { this.observer.disconnect(); }
  private decorate(): void {
    Array.from(this.host.children).forEach((child, index) => {
      const row = child as HTMLElement;
      row.draggable = true;
      if (row.querySelector(':scope > .reorder-actions')) return;
      const actions = document.createElement('span'); actions.className = 'reorder-actions flex gap-1';
      for (const [label, delta] of [['Sposta su', -1], ['Sposta giù', 1]] as const) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-ghost btn-xs';
        button.setAttribute('aria-label', label); button.textContent = delta < 0 ? '↑' : '↓';
        button.onclick = event => { event.stopPropagation(); const i = Array.from(this.host.children).indexOf(row); this.move(i, i + delta); };
        actions.append(button);
      }
      row.append(actions);
    });
  }
  private index(target: EventTarget | null): number {
    const row = Array.from(this.host.children).find(child => child.contains(target as Node));
    return row ? Array.from(this.host.children).indexOf(row) : -1;
  }
  private move(from: number, to: number): void {
    if (from >= 0 && to >= 0 && to < this.host.children.length && from !== to) this.itemsReordered.emit({ detail: { from, to, complete: () => {} } });
  }
  @HostListener('dragstart', ['$event']) start(event: DragEvent): void { this.from = this.index(event.target); event.dataTransfer?.setData('text/plain', String(this.from)); }
  @HostListener('dragover', ['$event']) over(event: DragEvent): void { event.preventDefault(); }
  @HostListener('drop', ['$event']) drop(event: DragEvent): void { event.preventDefault(); this.move(this.from, this.index(event.target)); this.from = -1; }
}

@Component({
  selector: 'app-dialog',
  imports: [NgTemplateOutlet],
  template: `<dialog #dialog class="modal" (cancel)="cancel($event)" (click)="backdrop($event)"><div class="modal-box max-w-3xl p-0"><ng-container [ngTemplateOutlet]="content || null" /></div></dialog>`,
})
export class DialogComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @ContentChild(TemplateRef) content?: TemplateRef<unknown>;
  @ViewChild('dialog') dialog?: ElementRef<HTMLDialogElement>;
  ngAfterViewInit(): void { this.sync(); }
  ngOnChanges(): void { this.sync(); }
  ngOnDestroy(): void { this.dialog?.nativeElement.close(); }
  private sync(): void { const d = this.dialog?.nativeElement; if (!d) return; if (this.isOpen && !d.open) d.showModal(); else if (!this.isOpen && d.open) d.close(); }
  cancel(event: Event): void { event.preventDefault(); this.dismiss(); }
  backdrop(event: MouseEvent): void { if (event.target === this.dialog?.nativeElement) this.dismiss(); }
  dismiss(): void { this.dialog?.nativeElement.close(); this.closed.emit(); }
}

interface DialogInput { name?: string; type?: string; placeholder?: string; value?: string | number; label?: string; }
interface DialogButton { text: string; role?: string; handler?: (value: Record<string, any>) => unknown; }
interface DialogOptions { header?: string; message?: string; inputs?: DialogInput[]; buttons?: Array<string | DialogButton>; }
function dialogShell(label: string): { dialog: HTMLDialogElement; box: HTMLDivElement } {
  const dialog = document.createElement('dialog'); dialog.className = 'modal'; dialog.setAttribute('aria-label', label);
  const box = document.createElement('div'); box.className = 'modal-box'; dialog.append(box);
  return { dialog, box };
}
@Injectable({ providedIn: 'root' })
export class DialogService {
  async create(options: DialogOptions): Promise<{ present: () => Promise<void> }> {
    return { present: async () => {
      const { dialog, box } = dialogShell(options.header || 'Conferma');
      const title = document.createElement('h2'); title.className = 'text-xl font-semibold'; title.textContent = options.header || ''; box.append(title);
      const message = document.createElement('p'); message.className = 'py-4 whitespace-pre-line'; message.textContent = options.message || ''; box.append(message);
      const fields = new Map<string, HTMLInputElement>();
      for (const field of options.inputs || []) {
        const label = document.createElement('label'); label.className = 'form-control block my-3';
        label.textContent = field.label || field.placeholder || field.name || '';
        const input = document.createElement('input'); input.className = 'input w-full'; input.type = field.type || 'text'; input.value = String(field.value ?? ''); input.placeholder = field.placeholder || ''; label.append(input); box.append(label); fields.set(field.name || '', input);
      }
      const close = (): void => { dialog.close(); dialog.remove(); };
      const buttons = options.buttons?.length ? options.buttons : ['OK'];
      const actions = document.createElement('div'); actions.className = 'modal-action'; box.append(actions);
      for (const item of buttons) {
        const option = typeof item === 'string' ? { text: item } : item;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = option.text;
        button.className = `btn ${option.role === 'cancel' ? 'btn-ghost' : option.role === 'destructive' ? 'btn-error' : 'btn-primary'}`;
        button.onclick = async () => {
          const result = await option.handler?.(Object.fromEntries(Array.from(fields, ([name, input]) => [name, input.value])));
          if (result !== false) close();
        }; actions.append(button);
      }
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
      document.body.append(dialog); dialog.showModal();
    } };
  }
}
@Injectable({ providedIn: 'root' })
export class ToastService {
  async create(options: { message: string; duration?: number; color?: string; position?: string }): Promise<{ present: () => Promise<void> }> {
    return { present: async () => {
      const toast = document.createElement('div'); toast.className = 'toast toast-bottom toast-end z-[1000]'; toast.setAttribute('role', 'status');
      const alert = document.createElement('div'); alert.className = `alert alert-${options.color === 'danger' ? 'error' : options.color === 'success' ? 'success' : 'info'}`; alert.textContent = options.message;
      toast.append(alert); document.body.append(toast); setTimeout(() => toast.remove(), options.duration ?? 3500);
    } };
  }
}
@Injectable({ providedIn: 'root' })
export class OverlayService {
  private readonly application = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);
  private readonly stack: Array<(data?: unknown, role?: string) => void> = [];
  async create<T>(options: { component: Type<T>; componentProps?: Record<string, unknown>; cssClass?: string }) {
    const { dialog, box } = dialogShell('Dettagli brano');
    box.className = 'modal-box max-w-3xl p-0';
    if (options.cssClass) dialog.classList.add(options.cssClass);
    const host = document.createElement('div'); host.className = 'overlay-page'; box.append(host);
    const component = createComponent(options.component, { hostElement: host, environmentInjector: this.environment });
    for (const [key, value] of Object.entries(options.componentProps || {})) component.setInput(key, value);
    let resolve!: (result: { data?: unknown; role?: string }) => void;
    const result = new Promise<{ data?: unknown; role?: string }>(r => resolve = r);
    const dismiss = (data?: unknown, role?: string): void => {
      const index = this.stack.indexOf(dismiss); if (index >= 0) this.stack.splice(index, 1);
      dialog.close(); this.application.detachView(component.hostView); component.destroy(); dialog.remove(); resolve({ data, role });
    };
    dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(undefined, 'cancel'); });
    dialog.addEventListener('click', event => { if (event.target === dialog) dismiss(undefined, 'cancel'); });
    return {
      present: async () => { document.body.append(dialog); this.application.attachView(component.hostView); component.changeDetectorRef.detectChanges(); this.stack.push(dismiss); dialog.showModal(); },
      onDidDismiss: async <R>() => result as Promise<{ data?: R; role?: string }>,
    };
  }
  async dismiss(data?: unknown, role?: string): Promise<void> { this.stack.at(-1)?.(data, role); }
}

@NgModule({ imports: [SymbolComponent, BackDirective, SelectDirective, ReorderDirective, DialogComponent], exports: [SymbolComponent, BackDirective, SelectDirective, ReorderDirective, DialogComponent] })
export class NativeUiModule {}
