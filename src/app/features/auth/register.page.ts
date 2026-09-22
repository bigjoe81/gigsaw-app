import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';
import { DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent } from '../../shared/ui/daisyui';

@Component({
  standalone: true,
  imports: [RouterLink, DaisyButtonComponent, DaisyInputComponent, DaisyMessageComponent, IonContent],
  templateUrl: './register.page.html',
  styles: [`.register-content {
    --background: var(--gigsaw-background);
  }

  .register-content::part(scroll) {
    min-height: 100%;
    display: grid;
    align-items: center;
    padding-top: max(24px, var(--ion-safe-area-top));
    padding-bottom: max(24px, var(--ion-safe-area-bottom));
  }

  @media (max-width: 767px) {
    .register-content::part(scroll) {
      align-items: start;
    }
  }`],
})
export class RegisterPage {
  readonly name = signal('');
  readonly email = signal('');
  readonly touched = signal(false);
  readonly nameValid = computed(() => this.name().trim().length > 0);
  readonly emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/bands';
  loading = false; error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}

  updateName(name: string): void {
    this.name.set(name);
  }

  updateEmail(email: string): void {
    this.email.set(email);
  }

  requestOtp(): void {
    this.touched.set(true);

    if (!this.nameValid() || !this.emailValid() || this.loading) {
      return;
    }

    const name = this.name().trim();
    const email = this.email().trim();
    this.loading = true;
    this.error = '';
    this.auth.requestOtp({ name, email, purpose: 'register' }).subscribe({
      next: ({ challenge }) => void this.router.navigate(['/verify-otp'], {
        queryParams: {
          challengeId: challenge.challengeId,
          name,
          email: challenge.email,
          purpose: challenge.intent,
          returnUrl: this.returnUrl,
        },
      }),
      error: (error: {error?: {message?: string}}) => {
        this.error = error.error?.message || 'Invio codice non riuscito.';
        this.loading = false;
      },
    });
  }
  submit(): void { this.requestOtp(); }
}
