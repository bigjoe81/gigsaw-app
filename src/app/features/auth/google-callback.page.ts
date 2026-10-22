import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../shared/ui/native-ui';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule],
  templateUrl: './google-callback.page.html',
})
export class GoogleCallbackPage implements OnInit {
  error = '';
  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}
  ngOnInit(): void {
    const providerError = this.route.snapshot.queryParamMap.get('error');
    if (providerError) { this.error = 'L’accesso con Google è stato annullato o non autorizzato.'; return; }
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error = 'Codice di accesso Google mancante o non valido.';
      return;
    }

    this.auth.completeGoogleLogin(code).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.consumeGoogleReturnUrl()),
      error: () => this.error = 'Impossibile completare l’accesso con Google.',
    });
  }
  retry(): void { void this.router.navigateByUrl('/accedi'); }
}
