import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { BandService } from '../services/band.service';
import { BandContextService } from '../../../core/services/band-context.service';
interface Billing {
 status: string; has_access: boolean; plan: {name: string;type: string} | null;
 ends_at: string | null; payments_enabled: boolean; can_manage_payments: boolean;
}
interface Plan { monthly_available: boolean; yearly_available: boolean; id: number; name: string; description: string | null; type: string; currency: string; monthly_price_cents: number | null; yearly_price_cents: number | null; }
@Component({ changeDetection: ChangeDetectionStrategy.Default,
 standalone: true,
 imports: [NativeUiModule, GigsawFormControlsModule, DatePipe, CurrencyPipe, FormsModule, RouterLink, ],
 template: `
 <header class="page-header"><div class="navbar gap-3"><div class="flex items-center gap-2" slot="start"><app-gigsaw-button tone="unstyled" buttonClass="btn btn-ghost btn-square"  type="button" data-menu-toggle aria-label="Apri navigazione"><app-symbol name="bars" /></app-gigsaw-button></div><h1 class="grow text-xl">Abbonamento</h1></div></header>
 <section class="app-content p-4">
 <a [routerLink]="settingsUrl"><app-symbol name="arrow-back-outline" /> Impostazioni della band</a>
 @if (loading()) { <p>Caricamento…</p> }
 @if (error()) { <p><small class="text-sm text-error">{{ error() }}</small></p> }
 @if (returnedFromCheckout) { <p>Il checkout è terminato. La conferma dell’abbonamento può richiedere qualche istante: aggiorna lo stato prima di riprovare.</p> }
 @if (billing(); as state) {
 <article class="card bg-base-200 border border-base-300 my-4"><header class="px-6 pt-6"><h2 class="card-title">{{ state.plan?.name || 'Abbonamento della band' }}</h2></header><div class="card-body">
 <p>Stato: {{ statusLabel(state.status) }}</p>
 @if (state.ends_at) { <p>{{ state.status === 'beta' || state.status === 'trialing' ? 'Periodo gratuito fino al' : 'Scadenza' }} {{ state.ends_at | date:'dd/MM/yyyy' }}</p> }
 @if (state.status === 'beta' || state.status === 'expired') { <p>La Beta non genera addebiti automatici. Per attivare un piano a pagamento, un amministratore deve completare il checkout Stripe.</p> }
 @if (isAdmin && state.can_manage_payments && state.payments_enabled) { <app-gigsaw-button tone="unstyled" buttonClass="btn btn-primary" (click)="portal()" [disabled]="busy()" type="button">Gestisci pagamenti e fatture</app-gigsaw-button> }
 <app-gigsaw-button tone="unstyled" buttonClass="btn btn-outline" (click)="load()" [disabled]="busy()" type="button">Aggiorna stato</app-gigsaw-button>
 </div></article>
 @if (isAdmin && state.payments_enabled && (state.status === 'beta' || state.status === 'free' || state.status === 'expired' || state.status === 'unassigned')) {
 <app-gigsaw-input controlClass="w-full" aria-label="Email di fatturazione" type="email" [(ngModel)]="email" />
 <select class="select w-full" label="Periodo" [(ngModel)]="interval"><option value="monthly">Mensile</option><option value="yearly">Annuale</option></select>
 @for (plan of plans(); track plan.id) {
 @if (amount(plan) !== null) {
 <article class="card bg-base-200 border border-base-300 my-4"><header class="px-6 pt-6"><h2 class="card-title">{{ plan.name }}</h2></header><div class="card-body">
 <p>{{ plan.description }}</p><p>{{ (amount(plan) || 0) / 100 | currency:plan.currency.toUpperCase() }} / {{ interval === 'monthly' ? 'mese' : 'anno' }}</p>
 <p>Stripe mostrerà importo e data del primo addebito prima della conferma.</p>
 <app-gigsaw-button tone="unstyled" buttonClass="btn btn-primary" (click)="checkout(plan)" [disabled]="busy() || !email" type="button">Continua su Stripe</app-gigsaw-button>
 </div></article>
 }
 }
 @if (!plans().length) { <p>I piani a pagamento saranno disponibili al termine della Beta.</p> }
 } @else if (!state.payments_enabled) { <p>I pagamenti non sono ancora disponibili.</p> }
 }
 @if (!billing() && !loading()) { <app-gigsaw-button tone="unstyled" buttonClass="btn btn-primary" (click)="load()" type="button">Riprova</app-gigsaw-button> }
 </section>`,
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
