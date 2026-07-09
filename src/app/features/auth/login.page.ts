import {Component} from '@angular/core';

import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner
} from '@ionic/angular/standalone';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonInput, IonItem, IonLabel, IonNote, IonSpinner],
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
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading = false;
  error = '';

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {
  }

  login(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue() as {
      email: string;
      password: string
    }).subscribe({
      next: () => void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/bands'),
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message || 'Accesso non riuscito.';
        this.loading = false;
      }
    });
  }

  loginWithGoogle(): void {
    this.auth.startGoogleLogin(this.route.snapshot.queryParamMap.get('returnUrl') || '/bands');
  }
}
