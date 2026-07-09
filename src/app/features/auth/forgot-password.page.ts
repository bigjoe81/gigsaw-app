import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  readonly form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = false; error = ''; success = '';
  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService) {}
  submit(): void { if (this.form.invalid || this.loading) { this.form.markAllAsTouched(); return; } this.loading = true; this.error = ''; this.success = ''; this.auth.forgotPassword(this.form.getRawValue() as {email:string}).subscribe({ next: () => { this.success = 'Se l’email esiste, il link di reset è stato inviato.'; this.loading = false; }, error: (error: {error?: {status?: string; message?: string}}) => { this.error = error.error?.status || error.error?.message || 'Invio non riuscito.'; this.loading = false; } }); }
}
