import {Component, computed, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {IonContent, IonInput} from '@ionic/angular/standalone';
import {AuthService} from '../../core/auth/auth.service';
import {GigsawButtonComponent, GigsawMessageComponent} from '../../shared/ui/gigsaw';

@Component({
  standalone: true,
  imports: [RouterLink, GigsawButtonComponent, GigsawMessageComponent, IonContent, IonInput],
  templateUrl: './login.page.html',
  styleUrls: ['./auth-layout.scss'],
})
export class LoginPage {
  readonly email = signal('');
  readonly touched = signal(false);
  readonly emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  loading = false;
  error = '';
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/band';

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
    this.loading = true;
    this.error = '';
    this.auth.requestOtp({email, purpose: 'login'}).subscribe({
      next: ({challenge}) => void this.router.navigate(['/verifica-codice'], {
        queryParams: {
          challengeId: challenge.challengeId,
          email: challenge.email,
          purpose: challenge.intent,
          returnUrl: this.returnUrl,
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
    this.auth.startGoogleLogin(this.returnUrl);
  }
}
