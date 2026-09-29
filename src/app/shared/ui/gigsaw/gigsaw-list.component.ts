import { Component, input, output } from '@angular/core';
import { IonItem, IonList } from '@ionic/angular/standalone';
@Component({selector:'app-gigsaw-list',standalone:true,imports:[IonList],template:`<ion-list [attr.aria-label]="ariaLabel() || heading() || null"><ng-content /></ion-list>`})
export class GigsawListComponent { readonly heading=input(''); readonly ariaLabel=input(''); readonly surface=input(true); readonly shadow=input(false); readonly listClass=input(''); }
@Component({selector:'app-gigsaw-list-item, [app-gigsaw-list-item]',standalone:true,imports:[IonItem],template:`<ion-item [button]="interactive()" [disabled]="disabled()" [detail]="interactive()" (click)="activate()"><ng-content /></ion-item>`})
export class GigsawListItemComponent { readonly itemClass=input(''); readonly interactive=input(false); readonly disabled=input(false); readonly selected=output<void>(); activate():void { if(this.interactive()&&!this.disabled()) this.selected.emit(); } }
