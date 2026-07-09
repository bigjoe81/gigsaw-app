import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonNote, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [IonButton, IonContent, IonNote, IonSpinner],
  templateUrl: './google-callback.page.html',
  styles: ['.state{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center}'],
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
  retry(): void { void this.router.navigateByUrl('/login'); }
}
