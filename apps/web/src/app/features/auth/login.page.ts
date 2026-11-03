import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../shared/ui/native-ui';
import { DialogService } from '../../shared/ui/native-ui';
import {Component, computed, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {GigsawButtonComponent, GigsawMessageComponent} from '../../shared/ui/gigsaw';

import { AuthKeyboardScrollDirective } from './auth-keyboard-scroll.directive';
import { GigsawFormControlsModule } from '../../shared/ui/gigsaw/gigsaw-form-controls.module';

type LoginError = {
  status?: number;
  error?: {
    message?: string;
    errors?: { email?: string[] };
  };
};

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, GigsawFormControlsModule, AuthKeyboardScrollDirective, RouterLink, GigsawButtonComponent, GigsawMessageComponent, ],
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

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly alert: DialogService,
  ) {
  }

  updateEmail(email: string | number | null): void {
    this.email.set(String(email ?? ''));
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
      error: (error: LoginError) => {
        this.loading = false;
        if (this.isAccountNotFound(error)) {
          void this.offerRegistration(email);
          return;
        }
        this.error = error.error?.message || 'Invio codice non riuscito.';
      },
    });
  }

  submit(): void {
    this.requestOtp();
  }

  loginWithGoogle(): void {
    this.auth.startGoogleLogin(this.returnUrl);
  }

  private isAccountNotFound(error: LoginError): boolean {
    return error.status === 422
      && error.error?.errors?.email?.some((message) =>
        /^We could not find an account for this email address\.?$/i.test(message.trim()),
      ) === true;
  }

  private async offerRegistration(email: string): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Account non trovato',
      message: 'Non risulta un account associato a questo indirizzo email. Vuoi crearne uno?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Registrati',
          handler: () => this.router.navigate(['/registrati'], {
            queryParams: { email, returnUrl: this.returnUrl },
          }),
        },
      ],
    });
    await dialog.present();
  }
}
