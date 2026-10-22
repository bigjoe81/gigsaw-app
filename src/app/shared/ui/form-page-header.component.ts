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
  styles: `
    :host(.refined-form-header) {
      display: block;
      flex-shrink: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    :host(.refined-form-header) ion-header { box-shadow: none; }
    :host(.refined-form-header) ion-toolbar { --border-width: 0; }
    :host(.refined-form-header) ion-title {
      font-family: inherit !important;
      font-weight: 600 !important;
      font-size: 1.1rem;
      letter-spacing: -.02em;
    }
    :host(.refined-form-header) ion-segment {
      width: calc(100% - 32px);
      max-width: 520px;
      margin: 4px auto 16px;
      padding: 4px;
      border-radius: 12px;
      background: var(--gigsaw-input-background);
      --background: transparent;
    }
    :host(.refined-form-header) ion-segment-button {
      min-height: 36px;
      min-width: 0;
      flex: 1;
      margin: 0;
      text-transform: none;
      letter-spacing: 0;
      font-size: .82rem;
      --color: var(--gigsaw-muted);
      --color-checked: var(--gigsaw-text);
      --indicator-color: #343b46;
      --indicator-height: 100%;
      --indicator-box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    :host(.refined-form-header) ion-segment-button::part(indicator-background) { border-radius: 8px; }
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
