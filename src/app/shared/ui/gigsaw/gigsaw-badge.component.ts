import { Component, input, output } from '@angular/core';
import { IonBadge, IonButton } from '@ionic/angular/standalone';
export type GigsawBadgeTone='default'|'neutral'|'primary'|'secondary'|'accent'|'info'|'success'|'warning'|'error';
export type GigsawBadgeStyle='solid'|'outline'|'soft'|'ghost';
export type GigsawBadgeSize='xs'|'sm'|'md'|'lg'|'xl';
@Component({selector:'app-gigsaw-badge',standalone:true,imports:[IonBadge,IonButton],template:`<ion-badge [color]="tone() === 'error' ? 'danger' : tone() === 'default' || tone() === 'neutral' ? 'medium' : tone()" [class.ion-padding-horizontal]="size() === 'lg' || size() === 'xl'"><ng-content />@if(dismissible()){<ion-button fill="clear" size="small" [attr.aria-label]="dismissLabel()" (click)="dismissed.emit()">×</ion-button>}</ion-badge>`})
export class GigsawBadgeComponent { readonly tone=input<GigsawBadgeTone>('default'); readonly appearance=input<GigsawBadgeStyle>('solid'); readonly size=input<GigsawBadgeSize>('md'); readonly dismissible=input(false); readonly dismissLabel=input('Rimuovi'); readonly badgeClass=input(''); readonly dismissed=output<void>(); }
