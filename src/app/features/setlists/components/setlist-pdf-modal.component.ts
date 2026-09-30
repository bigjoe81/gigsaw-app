import { Component, input, output } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSelect, IonSelectOption, IonCheckbox } from '@ionic/angular/standalone';
import { SetlistPdfOptions } from '../models/setlist.models';
import { SetlistPdfFormat } from '../services/setlist-pdf.service';

@Component({
  selector: 'app-setlist-pdf-modal',
  standalone: true,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSelect, IonSelectOption, IonCheckbox],
  styles: [`ion-modal { --width: min(520px, calc(100vw - 32px)); --height: 420px; --border-radius: 16px; } .options { display: grid; gap: 24px; padding: 24px; } .actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }`],
  template: `
    <ion-modal [isOpen]="isOpen()" (didDismiss)="closed.emit()">
      <ng-template>
        <ion-header><ion-toolbar>
          <ion-title>Esporta PDF</ion-title>
          <ion-buttons slot="end"><ion-button (click)="closed.emit()">Chiudi</ion-button></ion-buttons>
        </ion-toolbar></ion-header>
        <ion-content>
          <div class="options">
            <ion-select label="Formato PDF" aria-label="Formato PDF" [value]="format()" (ionChange)="formatChange.emit($event.detail.value)" interface="popover">
              <ion-select-option value="a4">A4 · Standard</ion-select-option>
              <ion-select-option value="a3-large-print">A3 verticale · Alta leggibilità</ion-select-option>
              <ion-select-option value="large-print">A4 · Alta leggibilità · caratteri grandi</ion-select-option>
            </ion-select>
            <ion-checkbox [checked]="options().includePerformedBy" (ionChange)="changeOption('includePerformedBy', $event.detail.checked)">Autore</ion-checkbox>
            <ion-checkbox [checked]="options().includeKey" (ionChange)="changeOption('includeKey', $event.detail.checked)">Tonalità</ion-checkbox>
            <ion-checkbox [checked]="options().includeBpm" (ionChange)="changeOption('includeBpm', $event.detail.checked)">BPM</ion-checkbox>
            <div class="actions"><ion-button fill="outline" (click)="closed.emit()">Annulla</ion-button><ion-button (click)="confirmed.emit()">{{ actionLabel() }}</ion-button></div>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
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
