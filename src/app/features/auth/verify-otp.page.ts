import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';
import { OtpPurpose } from '../../core/auth/auth.models';
import { DaisyAlertComponent, DaisyButtonComponent, DaisyMessageComponent, DaisyOtpInputComponent } from '../../shared/ui/daisyui';

@Component({
  standalone: true,
  imports: [RouterLink, DaisyAlertComponent, DaisyButtonComponent, DaisyMessageComponent, DaisyOtpInputComponent, IonContent],
  templateUrl: './verify-otp.page.html',
  styles: [`.otp-content {
    --background: var(--gigsaw-background);
  }

  .otp-content::part(scroll) {
    min-height: 100%;
    display: grid;
    align-items: center;
    padding-top: max(24px, var(--ion-safe-area-top));
    padding-bottom: max(24px, var(--ion-safe-area-bottom));
  }

  .otp-shell {
    width: min(340px, 48vw);
    max-width: 100%;
    margin: 0 auto;
  }

  .otp-brand {
    display: grid;
    justify-items: center;
    gap: 14px;
    padding: 8px 0 24px;
  }

  .otp-brand img {
    width: min(300px, 48vw);
    height: auto;
    display: block;
  }

  .otp-brand img {
    object-fit: contain;
    filter: drop-shadow(0 14px 28px rgba(0, 0, 0, .12));
  }

  .otp-brand-note {
    font-size: .95rem;
    color: var(--ion-color-medium);
    text-align: center;
    max-width: 24rem;
  }

  .otp-shell form {
    width: 100%;
  }

  @media (max-width: 767px) {
    .otp-content::part(scroll) {
      align-items: start;
    }

    .otp-shell {
      width: 100%;
      padding-top: 8vh;
    }
  }`],
})
export class VerifyOtpPage {
  readonly code = signal('');
  readonly touched = signal(false);
  readonly codeValid = computed(() => /^\d{6}$/.test(this.code().trim()));
  readonly isExpiredCodeError = computed(() => {
    const error = this.error().toLowerCase();
    return error.includes('scadut') || error.includes('expired');
  });

  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly name = this.route.snapshot.queryParamMap.get('name') ?? '';
  readonly purpose = this.normalizedPurpose();
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/band';
  challengeId = Number(this.route.snapshot.queryParamMap.get('challengeId') ?? 0);

  loading = false;
  resending = false;
  readonly error = signal('');
  success = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  updateCode(code: string): void {
    this.code.set(code.replace(/\D/g, '').slice(0, 6));
  }

  verify(): void {
    if (!Number.isInteger(this.challengeId) || this.challengeId <= 0) {
      this.error.set('Richiesta di verifica mancante. Richiedi un nuovo codice.');
      return;
    }

    this.touched.set(true);

    if (!this.codeValid() || this.loading) {
      return;
    }

    this.loading = true;
    this.error.set('');
    this.success = '';
    this.auth.verifyOtp({
      challengeId: this.challengeId,
      code: this.code().trim(),
      purpose: this.purpose,
    }).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Codice non valido.');
        this.loading = false;
      },
    });
  }

  resend(): void {
    if (!Number.isInteger(this.challengeId) || this.challengeId <= 0 || this.resending) {
      return;
    }

    this.resending = true;
    this.error.set('');
    this.success = '';
    this.auth.resendOtp({
      challengeId: this.challengeId,
      purpose: this.purpose,
    }).subscribe({
      next: ({ challenge }) => {
        this.challengeId = challenge.challengeId;
        this.success = 'Nuovo codice inviato.';
        this.resending = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Invio codice non riuscito.');
        this.resending = false;
      },
    });
  }

  private normalizedPurpose(): OtpPurpose {
    return this.route.snapshot.queryParamMap.get('purpose') === 'register' ? 'register' : 'login';
  }
}
