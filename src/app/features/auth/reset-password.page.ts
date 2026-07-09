import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage {
  readonly form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], password_confirmation: ['', Validators.required] });
  loading = false; error = ''; success = '';
  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly route: ActivatedRoute, private readonly router: Router) {}
  submit(): void { const token = this.route.snapshot.queryParamMap.get('token') || ''; if (!token) { this.error = 'Token di reset mancante.'; return; } if (this.form.invalid || this.loading) { this.form.markAllAsTouched(); return; } this.loading = true; this.error = ''; this.success = ''; this.auth.resetPassword({ ...(this.form.getRawValue() as {email:string;password:string;password_confirmation:string}), token }).subscribe({ next: () => { this.success = 'Password aggiornata. Ora puoi accedere.'; this.loading = false; void this.router.navigateByUrl('/login'); }, error: (error: {error?: {status?: string; message?: string}}) => { this.error = error.error?.status || error.error?.message || 'Reset non riuscito.'; this.loading = false; } }); }
}
