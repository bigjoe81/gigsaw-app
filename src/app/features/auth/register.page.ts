import { Component, computed, signal, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, timer, map } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';
import { GigsawButtonComponent, GigsawMessageComponent } from '../../shared/ui/gigsaw';

import { AuthKeyboardScrollDirective } from './auth-keyboard-scroll.directive';

@Component({
  standalone: true,
  imports: [AuthKeyboardScrollDirective, RouterLink, GigsawButtonComponent, GigsawMessageComponent, IonContent, IonInput],
  templateUrl: './register.page.html',
  styleUrls: ['./auth-layout.scss'],
})
export class RegisterPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private registrationToken = '';
  readonly spamReady = signal(false);
  readonly spamPreparing = signal(false);
  readonly website = signal('');
  readonly name = signal('');
  readonly email = signal('');
  readonly touched = signal(false);
  readonly nameValid = computed(() => this.name().trim().length > 0);
  readonly emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/band';
  loading = false; error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.prepareSpamCheck();
  }

  prepareSpamCheck(): void {
    if (this.spamPreparing()) return;
    this.spamPreparing.set(true);
    this.spamReady.set(false);
    this.registrationToken = '';
    this.auth.registrationChallenge().pipe(
      switchMap((challenge) => timer(challenge.waitSeconds * 1000).pipe(map(() => challenge.token))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (token) => {
        this.registrationToken = token;
        this.spamReady.set(true);
        this.spamPreparing.set(false);
      },
      error: () => {
        this.spamPreparing.set(false);
        this.error = 'Verifica antispam non disponibile. Premi Invia codice OTP per riprovare.';
      },
    });
  }

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

    if (!this.spamReady()) {
      this.prepareSpamCheck();
      return;
    }

    const name = this.name().trim();
    const email = this.email().trim();
    this.loading = true;
    this.error = '';
    this.auth.requestOtp({ name, email, purpose: 'register', registrationToken: this.registrationToken, website: this.website() }).subscribe({
      next: ({ challenge }) => void this.router.navigate(['/verifica-codice'], {
        queryParams: {
          challengeId: challenge.challengeId,
          name,
          email: challenge.email,
          purpose: challenge.intent,
          returnUrl: this.returnUrl,
        },
      }),
      error: (error: {error?: {message?: string; errors?: {registration_token?: string[]}}}) => {
        this.error = error.error?.errors?.registration_token?.[0] || error.error?.message || 'Invio codice non riuscito.';
        this.loading = false;
        this.prepareSpamCheck();
      },
    });
  }
  submit(): void { this.requestOtp(); }
}
