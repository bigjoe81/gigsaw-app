import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NativeUiModule, ToastService } from '../../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { GigsawListComponent, GigsawListItemComponent } from '../../../../shared/ui/gigsaw';
import { Band, PendingBandInvitation } from '../../models/band.models';
import { BandService } from '../../services/band.service';

@Component({
  selector: 'app-band-invites-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    NativeUiModule,
    GigsawFormControlsModule,
    ReactiveFormsModule,
    GigsawListComponent,
    GigsawListItemComponent,
  ],
  templateUrl: './band-invites-settings.component.html',
  styleUrl: './band-invites-settings.component.scss',
})
export class BandInvitesSettingsComponent {
  @Input({ required: true }) band!: Band;
  @Output() readonly reload = new EventEmitter<void>();
  private readonly bandService = inject(BandService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private get bandId(): number {
    return this.band.id;
  }
  private readonly fb = inject(FormBuilder);
  readonly inviteForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['BAND_MEMBER'],
  });

  inviting = false;
  inviteError = '';
  lastInvitation?: PendingBandInvitation;
  readonly canShareOnWhatsApp = this.isMobileDevice();
  get bandInviteLink(): string {
    return this.buildInvitationUrl();
  }
  invite(): void {
    if (this.inviteForm.invalid || this.inviting) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviting = true;
    this.inviteError = '';
    const payload = this.inviteForm.getRawValue();

    this.bandService
      .invite(this.bandId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (invitation) => {
          this.inviting = false;
          this.lastInvitation = {
            ...invitation,
            name: invitation.name || payload.name,
            email: invitation.email || payload.email,
            role: invitation.role || payload.role,
          };
          this.inviteForm.patchValue({ name: '', email: '', role: 'BAND_MEMBER' });
          (
            await this.toast.create({ message: 'Invito pronto da condividere.', duration: 1800, color: 'success' })
          ).present();
          this.reload.emit();
        },
        error: async (error: { error?: { message?: string } }) => {
          this.inviting = false;
          this.inviteError = error.error?.message || 'Invio invito non riuscito.';
          (await this.toast.create({ message: this.inviteError, duration: 2200, color: 'danger' })).present();
        },
      });
  }

  shareInvitationOnWhatsApp(invitation: PendingBandInvitation): void {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(this.invitationMessage(invitation))}`;
    const opened = window.open(shareUrl, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.assign(shareUrl);
  }

  shareInvitationByEmail(invitation: PendingBandInvitation): void {
    const subject = `Invito a partecipare a ${this.band?.name ?? 'GigSaw'}`;
    const body = this.invitationMessage(invitation);
    window.location.href = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async copyInvitationLink(invitation: PendingBandInvitation): Promise<void> {
    const inviteUrl = this.invitationUrl(invitation);
    if (navigator.clipboard) await navigator.clipboard.writeText(inviteUrl);
    (await this.toast.create({ message: 'Link invito copiato.', duration: 1600, color: 'success' })).present();
  }

  async copyBandInviteLink(): Promise<void> {
    if (!this.bandInviteLink) return;
    if (navigator.clipboard) await navigator.clipboard.writeText(this.bandInviteLink);
    (await this.toast.create({ message: 'Link invito copiato.', duration: 1600, color: 'success' })).present();
  }

  shareBandInviteOnWhatsApp(): void {
    this.shareInvitationOnWhatsApp({ id: 0, name: '', email: '', role: 'BAND_MEMBER' });
  }

  scrollToPersonalInvite(): void {
    document.getElementById('personal-invite-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private invitationMessage(invitation: PendingBandInvitation): string {
    const greeting = invitation.name?.trim() ? `Ciao ${invitation.name.trim()}!` : 'Ciao!';
    const bandName = this.band?.name ?? 'la mia band';
    return `${greeting} Ti invito a partecipare alla band “${bandName}” su GigSaw. Apri il link e premi “Partecipa”:\n${this.invitationUrl(invitation)}`;
  }

  private invitationUrl(invitation: PendingBandInvitation): string {
    if (invitation.inviteUrl) return invitation.inviteUrl;

    return this.buildInvitationUrl(invitation.name);
  }

  private buildInvitationUrl(inviteeName?: string): string {
    const code = this.band?.joinCode?.trim();
    if (!code || typeof window === 'undefined') return '';

    const url = new URL(`/invito/${encodeURIComponent(code)}`, window.location.origin);
    if (this.band?.name) url.searchParams.set('band', this.band.name);
    if (inviteeName) url.searchParams.set('name', inviteeName);
    url.searchParams.set('bandId', String(this.bandId));
    return url.toString();
  }

  private isMobileDevice(): boolean {
    return (
      typeof window !== 'undefined' && (window.matchMedia('(max-width: 767px)').matches || navigator.maxTouchPoints > 0)
    );
  }

  roleLabel(role?: string | null): string {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'BAND_MEMBER') return 'Membro band';
    return role || '—';
  }
}
