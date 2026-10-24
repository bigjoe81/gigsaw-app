import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../shared/ui/native-ui';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { OtpPurpose } from '../../core/auth/auth.models';
import { GigsawAlertComponent, GigsawButtonComponent, GigsawMessageComponent, GigsawOtpInputComponent } from '../../shared/ui/gigsaw';

import { AuthKeyboardScrollDirective } from './auth-keyboard-scroll.directive';
import { UpcomingRehearsalPromptService } from './upcoming-rehearsal-prompt.service';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, AuthKeyboardScrollDirective, RouterLink, GigsawAlertComponent, GigsawButtonComponent, GigsawMessageComponent, GigsawOtpInputComponent, ],
  templateUrl: './verify-otp.page.html',
  styleUrls: ['./auth-layout.scss'],
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
  readonly resending = signal(false);
  readonly error = signal('');
  success = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly upcomingRehearsalPrompt: UpcomingRehearsalPromptService,
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
      next: () => {
        const destination = this.purpose === 'register' && this.returnUrl === '/band'
          ? '/inizia'
          : this.returnUrl;
        void this.router.navigateByUrl(destination).then(() => {
          if (this.purpose === 'login') this.upcomingRehearsalPrompt.checkForUpcomingRehearsals();
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Codice non valido.');
        this.loading = false;
      },
    });
  }

  resend(): void {
    if (!Number.isInteger(this.challengeId) || this.challengeId <= 0 || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.error.set('');
    this.success = '';
    this.auth.resendOtp({
      challengeId: this.challengeId,
      purpose: this.purpose,
    }).pipe(finalize(() => this.resending.set(false))).subscribe({
      next: ({ challenge }) => {
        this.challengeId = challenge.challengeId;
        this.code.set('');
        this.touched.set(false);
        this.success = 'Nuovo codice inviato.';
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'Invio codice non riuscito.');
      },
    });
  }

  private normalizedPurpose(): OtpPurpose {
    return this.route.snapshot.queryParamMap.get('purpose') === 'register' ? 'register' : 'login';
  }
}
