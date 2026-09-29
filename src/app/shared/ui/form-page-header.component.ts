import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

export interface FormPageHeaderSection {
  id: number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-page-header',
  standalone: true,
  imports: [RouterLink, IonIcon],
  template: `
    <header class="form-page-header">
      <div class="form-page-header__inner">
        <a class="form-page-header__back" [routerLink]="backHref" aria-label="Torna indietro">
          <ion-icon name="arrow-back-outline" aria-hidden="true" />
        </a>
        <div class="form-page-header__copy">
          <span class="form-page-header__eyebrow">{{ eyebrow }}</span>
          <h1>{{ title }}</h1>
          @if (subtitle) { <p>{{ subtitle }}</p> }
        </div>
      </div>
      @if (sections.length > 1) {
        <nav class="form-page-header__nav" [attr.aria-label]="ariaLabel">
          <div class="form-page-header__nav-inner">
            @for (section of sections; track section.id) {
              <button
                type="button"
                [class.active]="section.id === activeSection"
                [disabled]="section.disabled"
                [attr.aria-current]="section.id === activeSection ? 'step' : null"
                (click)="sectionChange.emit(section.id)">
                <span>{{ section.id }}</span>{{ section.label }}
              </button>
            }
          </div>
        </nav>
      }
    </header>
  `,
  styles: [`
    :host { display: block; }
    .form-page-header { color: #fff; background: var(--ion-gradient-brand); box-shadow: 0 10px 30px rgba(0,0,0,.18); }
    .form-page-header__inner { display: flex; width: min(1180px, 100%); margin: 0 auto; gap: 18px; align-items: flex-start; padding: 30px clamp(20px,5vw,72px) 24px; }
    .form-page-header__back { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; margin-top: 2px; border: 1px solid rgba(255,255,255,.28); border-radius: 12px; color: #fff; background: rgba(255,255,255,.1); text-decoration: none; }
    .form-page-header__back:hover { background: rgba(255,255,255,.17); }
    .form-page-header__back ion-icon { font-size: 21px; }
    .form-page-header__copy { min-width: 0; }
    .form-page-header__eyebrow { display: block; margin-bottom: 5px; font-size: .72rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.72); }
    h1 { margin: 0; font-size: clamp(1.65rem,3vw,2.35rem); line-height: 1.08; }
    p { max-width: 720px; margin: 8px 0 0; line-height: 1.45; color: rgba(255,255,255,.82); }
    .form-page-header__nav { border-top: 1px solid rgba(255,255,255,.14); }
    .form-page-header__nav-inner { display: flex; width: min(1180px,100%); margin: 0 auto; padding: 0 clamp(20px,5vw,72px); overflow-x: auto; scrollbar-width: none; }
    .form-page-header__nav-inner::-webkit-scrollbar { display: none; }
    button { position: relative; display: flex; min-height: 52px; flex: 0 0 auto; align-items: center; gap: 8px; padding: 0 18px; border: 0; color: rgba(255,255,255,.68); background: transparent; font: inherit; font-size: .82rem; font-weight: 800; cursor: pointer; }
    button span { display: grid; width: 23px; height: 23px; place-items: center; border: 1px solid rgba(255,255,255,.34); border-radius: 50%; font-size: .7rem; }
    button.active { color: #fff; }
    button.active::after { position: absolute; right: 14px; bottom: 0; left: 14px; height: 3px; border-radius: 3px 3px 0 0; background: #fff; content: ''; }
    button.active span { color: var(--ion-color-brand-blue); border-color: #fff; background: #fff; }
    button:disabled { opacity: .42; cursor: default; }
    @media (max-width: 680px) {
      .form-page-header__inner { gap: 12px; padding-top: 20px; padding-bottom: 18px; }
      .form-page-header__back { width: 38px; height: 38px; flex-basis: 38px; }
      p { display: none; }
      h1 { font-size: 1.55rem; }
      button { min-height: 48px; padding: 0 13px; }
    }
  `],
})
export class FormPageHeaderComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() backHref: string | any[] = '../';
  @Input() sections: FormPageHeaderSection[] = [];
  @Input() activeSection = 1;
  @Input() ariaLabel = 'Sezioni del form';
  @Output() readonly sectionChange = new EventEmitter<number>();

  constructor() { addIcons({ arrowBackOutline }); }
}
