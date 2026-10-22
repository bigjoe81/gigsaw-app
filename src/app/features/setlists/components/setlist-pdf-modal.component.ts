import { NativeUiModule } from '../../../shared/ui/native-ui';
import { Component, input, output } from '@angular/core';
import { SetlistPdfOptions } from '../models/setlist.models';
import { SetlistPdfFormat } from '../services/setlist-pdf.service';

@Component({
  selector: 'app-setlist-pdf-modal',
  standalone: true,
  imports: [NativeUiModule],
  styles: [`app-dialog { --width: min(520px, calc(100vw - 32px)); --height: 420px; --border-radius: 16px; } .options { display: grid; gap: 24px; padding: 24px; } .actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }`],
  template: `
    <app-dialog [isOpen]="isOpen()" (closed)="closed.emit()">
      <ng-template>
        <header class="page-header"><div class="navbar gap-3">
          <h1 class="grow text-xl">Esporta PDF</h1>
          <div class="flex items-center gap-2" slot="end"><button class="btn btn-primary" (click)="closed.emit()" type="button">Chiudi</button></div>
        </div></header>
        <section class="app-content">
          <div class="options">
            <label class="gigsaw-select-field"><span>Formato PDF</span><select class="select w-full"  aria-label="Formato PDF" [appSelectValue]="format()" (selectionChange)="formatChange.emit($event)" appSelect>
              <option value="a4">A4 · Standard</option>
              <option value="a3-large-print">A3 verticale · Alta leggibilità</option>
              <option value="large-print">A4 · Alta leggibilità · caratteri grandi</option>
            </select></label>
            <label class="flex items-center gap-3"><input class="checkbox checkbox-primary" [checked]="options().includePerformedBy" (change)="changeOption('includePerformedBy', $any($event.target).checked)" type="checkbox" /><span>Autore</span></label>
            <label class="flex items-center gap-3"><input class="checkbox checkbox-primary" [checked]="options().includeKey" (change)="changeOption('includeKey', $any($event.target).checked)" type="checkbox" /><span>Tonalità</span></label>
            <label class="flex items-center gap-3"><input class="checkbox checkbox-primary" [checked]="options().includeBpm" (change)="changeOption('includeBpm', $any($event.target).checked)" type="checkbox" /><span>BPM</span></label>
            <div class="actions"><button class="btn btn-outline" (click)="closed.emit()" type="button">Annulla</button><button class="btn btn-primary" (click)="confirmed.emit()" type="button">{{ actionLabel() }}</button></div>
          </div>
        </section>
      </ng-template>
    </app-dialog>
  `,
})
export class SetlistPdfModalComponent {
  readonly isOpen = input(false);
  readonly format = input<SetlistPdfFormat>('a4');
  readonly options = input.required<SetlistPdfOptions>();
  readonly actionLabel = input('Scarica PDF');
  readonly closed = output<void>();
  readonly confirmed = output<void>();
  readonly formatChange = output<SetlistPdfFormat>();
  readonly optionsChange = output<SetlistPdfOptions>();

  changeOption(key: keyof SetlistPdfOptions, value: boolean): void {
    this.optionsChange.emit({ ...this.options(), [key]: value });
  }
}
