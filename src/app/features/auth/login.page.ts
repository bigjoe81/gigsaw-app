import { Component, computed, signal } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import {AuthService} from '../../core/auth/auth.service';
import { DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent } from '../../shared/ui/daisyui';

@Component({
  standalone: true,
  imports: [RouterLink, DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent, IonContent],
  templateUrl: './login.page.html',
  styles: [`.login-content::part(scroll) {
    min-height: 100%;
    display: grid;
    align-items: center;
    padding-top: max(24px, var(--ion-safe-area-top));
    padding-bottom: max(24px, var(--ion-safe-area-bottom));
  }

  .login-brand {
    display: grid;
    justify-items: center;
    gap: 14px;
    padding: 8px 0 24px;
  }

  .login-shell {
    width: min(340px, 48vw);
    max-width: 100%;
    margin: 0 auto;
  }

  .login-brand picture, .login-brand img {
    width: min(300px, 48vw);
    height: auto;
    display: block;
  }

  .login-brand img {
    object-fit: contain;
    filter: drop-shadow(0 14px 28px rgba(0, 0, 0, .12));
  }

  .login-brand-note {
    font-size: .95rem;
    color: var(--ion-color-medium);
    text-align: center;
    max-width: 24rem;
  }

  .login-shell ion-item,
  .login-shell ion-button,
  .login-shell ion-note,
  .login-shell form {
    width: 100%;
  }

  @media (max-width: 767px) {
    .login-content::part(scroll) {
      align-items: start;
    }

    .login-shell {
      width: 100%;
      padding-top: 8vh;
    }
  }`],
})
export class LoginPage {
  readonly email = signal('');
  readonly touched = signal(false);
  readonly emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  loading = false;
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {
  }

  updateEmail(email: string): void {
    this.email.set(email);
  }

  requestOtp(): void {
    this.touched.set(true);

    if (!this.emailValid() || this.loading) {
      return;
    }

    const email = this.email().trim();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/bands';
    this.loading = true;
    this.error = '';
    this.auth.requestOtp({ email, purpose: 'login' }).subscribe({
      next: ({ challenge }) => void this.router.navigate(['/verify-otp'], {
        queryParams: {
          challengeId: challenge.challengeId,
          email: challenge.email,
          purpose: challenge.intent,
          returnUrl,
        },
      }),
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message || 'Invio codice non riuscito.';
        this.loading = false;
      },
    });
  }

  submit(): void {
    this.requestOtp();
  }

  loginWithGoogle(): void {
    this.auth.startGoogleLogin(this.route.snapshot.queryParamMap.get('returnUrl') || '/bands');
  }
}
