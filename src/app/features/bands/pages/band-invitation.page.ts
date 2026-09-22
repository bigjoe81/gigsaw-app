import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { DaisyButtonComponent, DaisyMessageComponent } from '../../../shared/ui/daisyui';
import { BandService } from '../services/band.service';

@Component({
  standalone: true,
  imports: [DaisyButtonComponent, DaisyMessageComponent, IonContent, IonIcon],
  templateUrl: './band-invitation.page.html',
  styleUrls: ['./band-invitation.page.scss'],
})
export class BandInvitationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly bandService = inject(BandService);
  private readonly bandContext = inject(BandContextService);

  readonly joinCode = this.route.snapshot.paramMap.get('joinCode')?.trim() ?? '';
  readonly bandName = this.route.snapshot.queryParamMap.get('band')?.trim() || 'una band';
  readonly inviteeName = this.route.snapshot.queryParamMap.get('name')?.trim() ?? '';
  readonly sessionLoading = signal(true);
  readonly authenticated = signal(false);
  readonly joining = signal(false);
  readonly error = signal('');

  constructor() {
    addIcons({ peopleOutline });
  }

  ngOnInit(): void {
    if (!this.joinCode) {
      this.error.set('Questo invito non contiene un codice valido.');
      this.sessionLoading.set(false);
      return;
    }

    if (this.auth.isAuthenticated) {
      this.authenticated.set(true);
      this.sessionLoading.set(false);
      return;
    }

    this.auth.restoreSession().pipe(
      finalize(() => this.sessionLoading.set(false)),
    ).subscribe((user) => this.authenticated.set(Boolean(user)));
  }

  participate(): void {
    if (this.joining() || !this.joinCode) return;

    if (!this.authenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.joining.set(true);
    this.error.set('');
    this.bandService.join(this.joinCode).subscribe({
      next: (band) => {
        this.bandContext.setCurrentBand(band.id);
        void this.router.navigateByUrl(`/band/${band.id}/dashboard`);
      },
      error: (error: { error?: { errors?: Record<string, string[]>; message?: string } }) => {
        this.error.set(
          error.error?.errors?.['join_code']?.[0]
          || error.error?.message
          || 'Non è stato possibile accettare l’invito.',
        );
        this.joining.set(false);
      },
    });
  }
}
