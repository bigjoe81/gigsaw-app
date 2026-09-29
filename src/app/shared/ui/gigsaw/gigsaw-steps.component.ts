import { Component, input } from '@angular/core';
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
export interface GigsawStepItem { label:string; active?:boolean; }
@Component({selector:'app-gigsaw-steps',standalone:true,imports:[IonSegment,IonSegmentButton],template:`<ion-segment [value]="activeLabel()" [scrollable]="true" [attr.aria-label]="ariaLabel()">@for(step of steps();track step.label){<ion-segment-button [value]="step.label" [disabled]="true">{{step.label}}</ion-segment-button>}</ion-segment>`})
export class GigsawStepsComponent { readonly steps=input<GigsawStepItem[]>([]); readonly horizontal=input(true); readonly ariaLabel=input(''); readonly stepsClass=input(''); activeLabel():string {return this.steps().find(s=>s.active)?.label ?? this.steps()[0]?.label ?? '';} }
