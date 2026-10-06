import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonNote, IonInput, IonSelect, IonSelectOption, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { BandService } from '../services/band.service';
import { BandContextService } from '../../../core/services/band-context.service';
interface Billing {
 status: string; has_access: boolean; plan: {name: string;type: string} | null;
 ends_at: string | null; payments_enabled: boolean; can_manage_payments: boolean;
}
interface Plan { monthly_available: boolean; yearly_available: boolean; id: number; name: string; description: string | null; type: string; currency: string; monthly_price_cents: number | null; yearly_price_cents: number | null; }
@Component({
 standalone: true,
 imports: [DatePipe, CurrencyPipe, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonNote, IonInput, IonSelect, IonSelectOption, IonButtons, IonMenuButton],
 template: `
 <ion-header><ion-toolbar><ion-buttons slot="start"><ion-menu-button menu="band-menu" /></ion-buttons><ion-title>Abbonamento</ion-title></ion-toolbar></ion-header>
 <ion-content class="ion-padding">
 <a [routerLink]="settingsUrl">← Impostazioni della band</a>
 @if (loading()) { <p>Caricamento…</p> }
 @if (error()) { <p><ion-note color="danger">{{ error() }}</ion-note></p> }
 @if (returnedFromCheckout) { <p>Il checkout è terminato. La conferma dell’abbonamento può richiedere qualche istante: aggiorna lo stato prima di riprovare.</p> }
 @if (billing(); as state) {
 <ion-card><ion-card-header><ion-card-title>{{ state.plan?.name || 'Abbonamento della band' }}</ion-card-title></ion-card-header><ion-card-content>
 <p>Stato: {{ statusLabel(state.status) }}</p>
 @if (state.ends_at) { <p>{{ state.status === 'beta' || state.status === 'trialing' ? 'Periodo gratuito fino al' : 'Scadenza' }} {{ state.ends_at | date:'dd/MM/yyyy' }}</p> }
 @if (state.status === 'beta' || state.status === 'expired') { <p>La Beta non genera addebiti automatici. Per attivare un piano a pagamento, un amministratore deve completare il checkout Stripe.</p> }
 @if (isAdmin && state.can_manage_payments && state.payments_enabled) { <ion-button (click)="portal()" [disabled]="busy()">Gestisci pagamenti e fatture</ion-button> }
 <ion-button fill="outline" (click)="load()" [disabled]="busy()">Aggiorna stato</ion-button>
 </ion-card-content></ion-card>
 @if (isAdmin && state.payments_enabled && (state.status === 'beta' || state.status === 'free' || state.status === 'expired' || state.status === 'unassigned')) {
 <ion-input label="Email di fatturazione" labelPlacement="stacked" type="email" [(ngModel)]="email" />
 <ion-select label="Periodo" [(ngModel)]="interval"><ion-select-option value="monthly">Mensile</ion-select-option><ion-select-option value="yearly">Annuale</ion-select-option></ion-select>
 @for (plan of plans(); track plan.id) {
 @if (amount(plan) !== null) {
 <ion-card><ion-card-header><ion-card-title>{{ plan.name }}</ion-card-title></ion-card-header><ion-card-content>
 <p>{{ plan.description }}</p><p>{{ (amount(plan) || 0) / 100 | currency:plan.currency.toUpperCase() }} / {{ interval === 'monthly' ? 'mese' : 'anno' }}</p>
 <p>Stripe mostrerà importo e data del primo addebito prima della conferma.</p>
 <ion-button (click)="checkout(plan)" [disabled]="busy() || !email">Continua su Stripe</ion-button>
 </ion-card-content></ion-card>
 }
 }
 @if (!plans().length) { <p>I piani a pagamento saranno disponibili al termine della Beta.</p> }
 } @else if (!state.payments_enabled) { <p>I pagamenti non sono ancora disponibili.</p> }
 }
 @if (!billing() && !loading()) { <ion-button (click)="load()">Riprova</ion-button> }
 </ion-content>`,
})
export class BandBillingPage {
 private readonly http = inject(HttpClient);
 private readonly route = inject(ActivatedRoute);
 private readonly bandService = inject(BandService);
 private readonly destroyRef = inject(DestroyRef);
 private readonly base = `${environment.apiUrl}${environment.apiPath}`;
 private readonly bandId = Number(this.route.snapshot.parent?.parent?.paramMap.get('bandId') ?? this.route.snapshot.parent?.paramMap.get('bandId') ?? this.route.snapshot.paramMap.get('bandId'));
 readonly settingsUrl = `/band/${this.bandId}/impostazioni`;
 readonly returnedFromCheckout = this.route.snapshot.queryParamMap.get('billing') === 'success';
 readonly billing = signal<Billing | null>(null);
 readonly plans = signal<Plan[]>([]);
 readonly loading = signal(false);
 readonly busy = signal(false);
 readonly error = signal('');
 isAdmin = false;
 email = inject(AuthService).currentUser()?.email || '';
 interval: 'monthly' | 'yearly' = 'monthly';
 constructor() {
  if (Number.isInteger(this.bandId) && this.bandId > 0) { inject(BandContextService).setCurrentBand(this.bandId); this.load(); }
  else this.error.set('Band non trovata.');
 }
 amount(plan: Plan): number | null { return this.interval === 'monthly' ? (plan.monthly_available ? plan.monthly_price_cents : null) : (plan.yearly_available ? plan.yearly_price_cents : null); }
 statusLabel(status: string): string { return ({beta:'Beta gratuita',free:'Gratuito',active:'Attivo',trialing:'Periodo gratuito',cancelling:'Cancellazione programmata',expired:'Scaduto',unassigned:'Da attivare',past_due:'Pagamento da regolarizzare',unpaid:'Pagamento non riuscito',incomplete:'Conferma pagamento richiesta',scheduled:'Attivazione programmata'} as Record<string,string>)[status] || status; }
 load(): void {
  this.loading.set(true); this.error.set('');
  forkJoin({band:this.bandService.get(this.bandId), billing:this.http.get<{data:Billing}>(`${this.base}/bands/${this.bandId}/billing`), plans:this.http.get<{data:Plan[]}>(`${this.base}/subscription-plans`)}).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>this.loading.set(false))).subscribe({
   next: ({band,billing,plans}) => {this.isAdmin=band.currentUserRole==='ADMIN';this.billing.set(billing.data);this.plans.set(plans.data.filter(plan=>plan.type==='paid'));},
   error: e=>this.error.set(e.error?.message || 'Impossibile caricare l’abbonamento.'),
  });
 }
 checkout(plan: Plan): void { this.redirect('checkout',{subscription_plan_id:plan.id,interval:this.interval,billing_email:this.email}); }
 portal(): void { this.redirect('portal',{}); }
 private redirect(action: string, body: object): void {
  if (this.busy() || !this.isAdmin) return;
  this.busy.set(true);this.error.set('');
  this.http.post<{url:string}>(`${this.base}/bands/${this.bandId}/billing/${action}`,body).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>this.busy.set(false))).subscribe({
   next: result=> { const url=new URL(result.url); if(url.protocol==='https:' && (url.hostname==='checkout.stripe.com' || url.hostname==='billing.stripe.com')) window.location.assign(url.href); else this.error.set('Indirizzo di pagamento non valido.'); },
   error: e=>this.error.set(e.error?.message || 'Impossibile aprire il pagamento. Riprova tra poco.'),
  });
 }
}
