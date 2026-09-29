import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
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
  imports: [IonBackButton, IonButtons, IonHeader, IonSegment, IonSegmentButton, IonTitle, IonToolbar],
  template: `
    <ion-header class="form-page-header" mode="md">
      <ion-toolbar class="form-page-header__toolbar" mode="md">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="backHref" text="" aria-label="Torna indietro" />
        </ion-buttons>
        <ion-title>
          <div class="form-page-header__copy">
            <strong>{{ title }}</strong>
          </div>
        </ion-title>
      </ion-toolbar>

      @if (sections.length > 1) {
        <ion-toolbar class="form-page-header__steps" mode="md">
          <ion-segment
            [value]="activeSection"
            [scrollable]="true"
            [attr.aria-label]="ariaLabel"
            (ionChange)="onSectionChange($event.detail.value)">
            @for (section of sections; track section.id) {
              <ion-segment-button [value]="section.id" [disabled]="section.disabled">
                <span class="step-number">{{ section.id }}</span>
                <span class="step-label">{{ section.label }}</span>
              </ion-segment-button>
            }
          </ion-segment>
        </ion-toolbar>
      }
    </ion-header>
  `,
  styles: [`
    :host { display: block; }
    .form-page-header {
      overflow: hidden;
      border-radius: 0 0 8px 8px;
      background: var(--gigsaw-header-background);
      box-shadow: 0 4px 14px rgba(0,0,0,.14);
    }
    .form-page-header::after { display: none; }
    .form-page-header__toolbar,
    .form-page-header__steps {
      --background: var(--gigsaw-header-background);
      --color: #fff;
      --border-width: 0;
    }
    .form-page-header__toolbar {
      --min-height: 56px;
      --background: linear-gradient(105deg, color-mix(in srgb, var(--ion-color-primary) 12%, var(--gigsaw-header-background)), var(--gigsaw-header-background) 58%);
      --padding-start: max(8px, env(safe-area-inset-left));
      --padding-end: max(12px, env(safe-area-inset-right));
    }
    .form-page-header__toolbar ion-title {
      position: static;
      width: auto;
      padding-inline: 4px 12px;
      text-align: left;
      transform: none;
    }
    .form-page-header__toolbar ion-back-button {
      --color: #fff;
      --icon-font-size: 24px;
      --padding-start: 10px;
      --padding-end: 10px;
    }
    .form-page-header__copy {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 10px;
      text-align: left;
    }
    .form-page-header__copy::before {
      flex: none;
      width: 3px;
      height: 22px;
      border-radius: 2px;
      background: var(--ion-color-primary);
      content: '';
    }
    .form-page-header__copy strong {
      overflow: hidden;
      font-size: 1.2rem;
      line-height: 1.2;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .form-page-header__steps {
      --min-height: 42px;
      border-top: 1px solid rgba(255,255,255,.08);
    }
    ion-segment {
      --background: transparent;
      width: 100%;
      padding-inline: max(8px, env(safe-area-inset-left)) max(8px, env(safe-area-inset-right));
    }
    ion-segment-button {
      --background: transparent;
      --background-checked: color-mix(in srgb, var(--ion-color-primary) 8%, transparent);
      --color: rgba(255,255,255,.64);
      --color-checked: #fff;
      --indicator-color: var(--ion-color-primary);
      --indicator-height: 3px;
      min-width: max-content;
      min-height: 42px;
      text-transform: none;
      font-size: .8rem;
      font-weight: 800;
    }
    .step-number {
      display: inline-grid;
      width: 18px;
      height: 18px;
      place-items: center;
      margin-right: 7px;
      color: rgba(255,255,255,.48);
      font-size: .7rem;
    }
    ion-segment-button.segment-button-checked .step-number {
      color: var(--ion-color-primary);
    }
    @media (max-width: 680px) {
      .form-page-header { border-radius: 0 0 8px 8px; }
      .form-page-header__toolbar { --min-height: 52px; }
      .form-page-header__copy strong { font-size: 1.1rem; }
      ion-segment-button { min-height: 42px; padding-inline: 4px; }
      .step-label { font-size: .75rem; }
    }
  `],
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
