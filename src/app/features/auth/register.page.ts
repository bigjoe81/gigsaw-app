import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  readonly form = this.fb.group({ name: ['', [Validators.required]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], password_confirmation: ['', Validators.required] });
  loading = false; error = '';
  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}
  register(): void { if (this.form.invalid || this.loading) { this.form.markAllAsTouched(); return; } this.loading = true; this.error = ''; this.auth.register(this.form.getRawValue() as {name:string;email:string;password:string;password_confirmation:string}).subscribe({ next: () => void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/bands'), error: (error: {error?: {message?: string}}) => { this.error = error.error?.message || 'Registrazione non riuscita.'; this.loading = false; } }); }
}
