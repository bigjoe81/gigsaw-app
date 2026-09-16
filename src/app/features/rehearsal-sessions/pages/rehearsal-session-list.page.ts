import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonRefresher, IonRefresherContent, IonSkeletonText, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, alertCircle, calendarOutline } from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { RehearsalSessionService } from '../services/rehearsal-session.service';

@Component({standalone:true,imports:[RouterLink,IonButton,IonButtons,IonContent,IonHeader,IonIcon,IonItem,IonLabel,IonList,IonMenuButton,IonRefresher,IonRefresherContent,IonSkeletonText,IonText,IonTitle,IonToolbar],templateUrl:'./rehearsal-session-list.page.html',styleUrls:['./rehearsal-session-list.page.scss']})
export class RehearsalSessionListPage implements OnInit {
 readonly sessions=signal<RehearsalSession[]>([]); readonly loading=signal(true); readonly error=signal('');
 constructor(private readonly api:RehearsalSessionService){addIcons({add,alertCircle,calendarOutline});}
 ngOnInit():void{this.load();}
 load(event?:CustomEvent):void{if(!event)this.loading.set(true);this.api.list().pipe(timeout(15000),finalize(()=>{this.loading.set(false);event?.detail.complete();})).subscribe({next:s=>this.sessions.set([...s].sort((a,b)=>String(a.date).localeCompare(String(b.date)))),error:(e:Error)=>this.error.set(e.message||'Impossibile caricare le prove.')});}
 formatDate(date?:string|null):string{return date?new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'2-digit',month:'short'}).format(new Date(`${date}T00:00:00`)):'Data da definire';}
 time(s:RehearsalSession):string{return [s.startTime,s.endTime].filter(Boolean).join(' – ')||'Orario da definire';}
}
