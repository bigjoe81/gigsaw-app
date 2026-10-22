import { NativeUiModule } from '../native-ui';
import { Component, input, output } from '@angular/core';
export type GigsawBadgeTone='default'|'neutral'|'primary'|'secondary'|'accent'|'info'|'success'|'warning'|'error';
export type GigsawBadgeStyle='solid'|'outline'|'soft'|'ghost';
export type GigsawBadgeSize='xs'|'sm'|'md'|'lg'|'xl';
@Component({selector:'app-gigsaw-badge',standalone:true,imports: [NativeUiModule],template:`<span [class]="'badge badge-' + size() + (tone() === 'default' ? '' : ' badge-' + tone()) + (appearance() === 'solid' ? '' : ' badge-' + appearance()) + ' ' + badgeClass()"><ng-content />@if(dismissible()){<button type="button" class="btn btn-ghost btn-xs btn-circle" [attr.aria-label]="dismissLabel()" (click)="dismissed.emit()">×</button>}</span>`})
export class GigsawBadgeComponent { readonly tone=input<GigsawBadgeTone>('default'); readonly appearance=input<GigsawBadgeStyle>('solid'); readonly size=input<GigsawBadgeSize>('md'); readonly dismissible=input(false); readonly dismissLabel=input('Rimuovi'); readonly badgeClass=input(''); readonly dismissed=output<void>(); }
