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
            <span class="form-page-header__eyebrow">{{ eyebrow }}</span>
            <strong>{{ title }}</strong>
            @if (subtitle) { <small>{{ subtitle }}</small> }
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
      border-radius: 0 0 10px 10px;
      background: var(--gigsaw-header-background);
      box-shadow: 0 6px 18px rgba(0,0,0,.18);
    }
    .form-page-header::after { display: none; }
    .form-page-header__toolbar,
    .form-page-header__steps {
      --background: var(--gigsaw-header-background);
      --color: #fff;
      --border-width: 0;
    }
    .form-page-header__toolbar {
      --min-height: 84px;
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
      display: grid;
      min-width: 0;
      gap: 2px;
      text-align: left;
    }
    .form-page-header__eyebrow {
      color: rgba(255,255,255,.68);
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .form-page-header__copy strong {
      overflow: hidden;
      font-size: clamp(1.3rem,2.2vw,1.8rem);
      line-height: 1.1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .form-page-header__copy small {
      overflow: hidden;
      max-width: 900px;
      margin-top: 3px;
      color: rgba(255,255,255,.8);
      font-size: .8rem;
      font-weight: 500;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .form-page-header__steps {
      --min-height: 48px;
      border-top: 1px solid var(--gigsaw-border);
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
      min-height: 48px;
      text-transform: none;
      font-size: .8rem;
      font-weight: 800;
    }
    .step-number {
      display: inline-grid;
      width: 22px;
      height: 22px;
      place-items: center;
      margin-right: 7px;
      border: 1px solid var(--gigsaw-border);
      border-radius: 999px;
      font-size: .68rem;
    }
    ion-segment-button.segment-button-checked .step-number {
      color: var(--ion-color-primary);
      border-color: color-mix(in srgb, var(--ion-color-primary) 45%, var(--gigsaw-border));
      background: color-mix(in srgb, var(--ion-color-primary) 10%, transparent);
    }
    @media (max-width: 680px) {
      .form-page-header { border-radius: 0 0 8px 8px; }
      .form-page-header__toolbar { --min-height: 68px; }
      .form-page-header__copy strong { font-size: 1.35rem; }
      .form-page-header__copy small { display: none; }
      ion-segment-button { min-height: 44px; padding-inline: 4px; }
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
