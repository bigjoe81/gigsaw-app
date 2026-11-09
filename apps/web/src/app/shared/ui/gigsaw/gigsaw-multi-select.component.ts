import { Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild } from '@angular/core';

export interface MultiSelectOption {
  id: number | string;
  label: string;
  detail?: string | null;
  disabled?: boolean;
}

@Component({
  selector: 'app-gigsaw-multi-select',
  template: `
    <div class="picker">
      <span class="label-text">{{ label() }}</span>
      <div class="trigger">
        @for (option of selected().slice(0, 2); track option.id) {
          <button class="badge badge-primary badge-soft" type="button"
            [attr.aria-label]="'Rimuovi ' + option.label" (click)="toggle(option.id)">
            {{ option.label }} ×
          </button>
        }
        <button #trigger type="button" class="open" [attr.aria-expanded]="open()"
          [attr.aria-label]="label() + ', ' + value().length + ' selezionati'" (click)="open() ? close() : show()">
          @if (!value().length) { Seleziona… }
          @if (value().length > 2) { +{{ value().length - 2 }} }
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      @if (open()) {
        <div class="popup" role="group" [attr.aria-label]="label()">
          <input #search class="input input-sm w-full" type="search" [attr.aria-label]="'Cerca in ' + label()"
            placeholder="Cerca…" [value]="query()" (input)="query.set($any($event.target).value)">
          <div class="options">
            @for (option of filtered(); track option.id) {
              <label>
                <input class="checkbox checkbox-primary checkbox-sm" type="checkbox"
                  [disabled]="!!option.disabled && !value().includes(option.id)"
                  [checked]="value().includes(option.id)" (change)="toggle(option.id)">
                <span>{{ option.label }} @if (option.detail) { <small>{{ option.detail }}</small> }</span>
              </label>
            } @empty { <p>Nessun risultato.</p> }
          </div>
          @if (ordered() && selected().length > 1) {
            <ol class="order" aria-label="Ordine selezionato">
              @for (option of selected(); track option.id; let i = $index) {
                <li><span>{{ i + 1 }}. {{ option.label }}</span>
                  <button type="button" class="btn btn-ghost btn-xs" [disabled]="i === 0"
                    [attr.aria-label]="'Sposta su ' + option.label" (click)="move(i, -1)">↑</button>
                  <button type="button" class="btn btn-ghost btn-xs" [disabled]="i === selected().length - 1"
                    [attr.aria-label]="'Sposta giù ' + option.label" (click)="move(i, 1)">↓</button>
                </li>
              }
            </ol>
          }
          <div class="actions"><span aria-live="polite">{{ value().length }} selezionati</span>
            <button type="button" class="btn btn-primary btn-sm" (click)="close()">Fatto</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .picker { position: relative; display: grid; gap: .45rem; }
    .trigger { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem; min-height: 2.65rem; padding: .25rem .5rem; border: 1px solid var(--gigsaw-border); border-radius: .6rem; }
    .badge { max-width: 100%; height: auto; white-space: normal; cursor: pointer; }
    .open { flex: 1; display: flex; justify-content: space-between; gap: .5rem; padding: .35rem; cursor: pointer; }
    .open span { margin-inline-start: auto; }
    .popup { position: absolute; z-index: 20; inset: calc(100% + .25rem) 0 auto; min-width: 0; padding: .65rem; background: var(--gigsaw-surface); border: 1px solid var(--gigsaw-border); border-radius: .75rem; box-shadow: 0 12px 30px #0007; }
    .options, .order { max-height: 10rem; overflow: auto; margin-block: .5rem; }
    .options label, .order li { display: flex; align-items: center; gap: .5rem; padding: .35rem; }
    .options small { display: block; color: var(--gigsaw-muted); }
    .order span { flex: 1; }
    .actions { display: flex; align-items: center; justify-content: space-between; gap: .5rem; border-top: 1px solid var(--gigsaw-border); padding-top: .5rem; }
    @media (max-width: 640px) { .popup { position: fixed; inset: auto .75rem 1rem; z-index: 100; } }
  `],
})
export class GigsawMultiSelectComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly MultiSelectOption[]>();
  readonly value = input<readonly (number | string)[]>([]);
  readonly ordered = input(false);
  readonly valueChange = output<(number | string)[]>();
  readonly open = signal(false);
  readonly query = signal('');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly selected = computed(() => {
    const options = new Map(this.options().map(option => [option.id, option]));
    return this.value().map(id => options.get(id) ?? { id, label: String(id) });
  });
  readonly filtered = computed(() => {
    const query = this.normalize(this.query().trim());
    return this.options().filter(option => this.normalize(option.label + ' ' + (option.detail ?? '')).includes(query));
  });

  show(): void {
    this.query.set('');
    this.open.set(true);
    setTimeout(() => this.search()?.nativeElement.focus());
  }

  close(restoreFocus = true): void {
    this.open.set(false);
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  toggle(id: number | string): void {
    const value = this.value();
    this.valueChange.emit(value.includes(id) ? value.filter(item => item !== id) : [...value, id]);
  }

  move(index: number, offset: number): void {
    const next = [...this.value()];
    const destination = index + offset;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    this.valueChange.emit(next);
  }

  @HostListener('document:click', ['$event'])
  outside(event: MouseEvent): void {
    if (this.open() && !event.composedPath().includes(this.host.nativeElement)) this.close(false);
  }

  @HostListener('keydown.escape', ['$event'])
  escape(event: Event): void {
    if (!this.open()) return;
    event.stopPropagation();
    this.close();
  }

  private normalize(text: string): string {
    return text.toLocaleLowerCase('it').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }
}
