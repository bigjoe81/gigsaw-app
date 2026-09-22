import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { DaisyButtonComponent, DaisyMessageComponent } from '../../../shared/ui/daisyui';
import { BandService } from '../services/band.service';

@Component({
  standalone: true,
  imports: [DaisyButtonComponent, DaisyMessageComponent, IonContent, IonIcon],
  templateUrl: './band-invitation.page.html',
  styleUrls: ['./band-invitation.page.scss'],
})
export class BandInvitationPage implements OnInit {
  private static readonly pendingInvitationKey = 'gigsaw.pending-band-invitation';
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);
  private readonly onboarding = inject(OnboardingService);

  readonly joinCode = this.route.snapshot.paramMap.get('joinCode')?.trim() ?? '';
  readonly bandName = this.route.snapshot.queryParamMap.get('band')?.trim() || 'una band';
  readonly inviteeName = this.route.snapshot.queryParamMap.get('name')?.trim() ?? '';
  readonly sessionLoading = signal(true);
  readonly authenticated = signal(false);
  readonly joining = signal(false);
  readonly error = signal('');

  constructor() {
    addIcons({ peopleOutline });
  }

  ngOnInit(): void {
    if (!this.joinCode) {
      this.error.set('Questo invito non contiene un codice valido.');
      this.sessionLoading.set(false);
      return;
    }

    if (this.auth.isAuthenticated) {
      this.authenticated.set(true);
      this.sessionLoading.set(false);
      this.completePendingInvitation();
      return;
    }

    this.auth.restoreSession().pipe(
      finalize(() => this.sessionLoading.set(false)),
    ).subscribe((user) => {
      this.authenticated.set(Boolean(user));
      if (user) this.completePendingInvitation();
    });
  }

  ionViewWillEnter(): void {
    if (!this.auth.isAuthenticated) return;

    this.authenticated.set(true);
    this.sessionLoading.set(false);
    this.completePendingInvitation();
  }

  participate(): void {
    if (this.joining() || !this.joinCode) return;

    if (!this.auth.isAuthenticated) {
      this.rememberPendingInvitation();
      void this.router.navigate(['/accedi'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.authenticated.set(true);
    this.joinBand();
  }

  private completePendingInvitation(): void {
    if (this.pendingInvitationCode() !== this.joinCode) return;

    this.joinBand();
  }

  private joinBand(): void {
    if (this.joining() || !this.joinCode) return;

    this.joining.set(true);
    this.error.set('');
    this.bandService.join(this.joinCode).subscribe({
      next: (band) => {
        this.clearPendingInvitation();
        this.bandContext.setCurrentBand(band.id);
        if (this.onboarding.shouldShow()) {
          void this.router.navigate(['/inizia'], { queryParams: { bandId: band.id, percorso: 'invito' } });
        } else {
          void this.router.navigateByUrl(`/band/${band.id}/panoramica`);
        }
      },
      error: (error: { status?: number; error?: { errors?: Record<string, string[]>; message?: string } }) => {
        if (error.status !== 401) this.clearPendingInvitation();
        this.error.set(
          error.error?.errors?.['join_code']?.[0]
          || error.error?.message
          || 'Non è stato possibile accettare l’invito.',
        );
        this.joining.set(false);
      },
    });
  }

  private rememberPendingInvitation(): void {
    try {
      sessionStorage.setItem(BandInvitationPage.pendingInvitationKey, this.joinCode);
    } catch {
      // The live authentication check still prevents a loop when storage is unavailable.
    }
  }

  private pendingInvitationCode(): string {
    try {
      return sessionStorage.getItem(BandInvitationPage.pendingInvitationKey) ?? '';
    } catch {
      return '';
    }
  }

  private clearPendingInvitation(): void {
    try {
      sessionStorage.removeItem(BandInvitationPage.pendingInvitationKey);
    } catch {
      // No action is required when storage is unavailable.
    }
  }
}
