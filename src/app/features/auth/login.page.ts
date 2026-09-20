import { Component, computed, signal } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import {AuthService} from '../../core/auth/auth.service';
import { DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent } from '../../shared/ui/daisyui';

@Component({
  standalone: true,
  imports: [RouterLink, DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent, IonContent],
  templateUrl: './login.page.html',
  styles: [`.login-content {
    --background: var(--gigsaw-background);
  }

  .login-content::part(scroll) {
    min-height: 100%;
    display: grid;
    align-items: center;
    padding-top: max(24px, var(--ion-safe-area-top));
    padding-bottom: max(24px, var(--ion-safe-area-bottom));
  }

  @media (max-width: 767px) {
    .login-content::part(scroll) {
      align-items: start;
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
