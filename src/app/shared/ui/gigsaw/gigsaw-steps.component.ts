import { NativeUiModule } from '../native-ui';
import { Component, input } from '@angular/core';
export interface GigsawStepItem { label:string; active?:boolean; }
@Component({selector:'app-gigsaw-steps',standalone:true,imports: [NativeUiModule],template:`<ol [class]="'steps ' + (horizontal() ? 'steps-horizontal' : 'steps-vertical') + ' ' + stepsClass()" [attr.aria-label]="ariaLabel()">@for(step of steps();track step.label){<li class="step" [class.step-primary]="step.active" [attr.aria-current]="step.active ? 'step' : null">{{step.label}}</li>}</ol>`})
export class GigsawStepsComponent { readonly steps=input<GigsawStepItem[]>([]); readonly horizontal=input(true); readonly ariaLabel=input(''); readonly stepsClass=input(''); activeLabel():string {return this.steps().find(s=>s.active)?.label ?? this.steps()[0]?.label ?? '';} }
