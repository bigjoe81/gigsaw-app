import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

export interface FormPageHeaderSection {
  id: number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-page-header',
  standalone: true,
  imports: [IonBackButton, IonButtons, IonHeader, IonLabel, IonSegment, IonSegmentButton, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="backHref" text="" aria-label="Torna indietro" />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>

      @if (sections.length > 1) {
        <ion-toolbar>
          <ion-segment
            [value]="activeSection"
            [scrollable]="true"
            [attr.aria-label]="ariaLabel"
            (ionChange)="onSectionChange($event.detail.value)">
            @for (section of sections; track section.id) {
              <ion-segment-button [value]="section.id" [disabled]="section.disabled">
                <ion-label>{{ section.label }}</ion-label>
              </ion-segment-button>
            }
          </ion-segment>
        </ion-toolbar>
      }
    </ion-header>
  `,
})
export class FormPageHeaderComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() backHref = '../';
  @Input() sections: FormPageHeaderSection[] = [];
  @Input() activeSection = 1;
  @Input() ariaLabel = 'Sezioni del form';
  @Output() readonly sectionChange = new EventEmitter<number>();

  onSectionChange(value: string | number | undefined | null): void {
    if (value === undefined || value === null) return;
    const id = Number(value);
    if (Number.isFinite(id)) this.sectionChange.emit(id);
  }
}
