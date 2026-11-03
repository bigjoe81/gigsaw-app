import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { finalize } from 'rxjs';
import { NativeUiModule, ToastService } from '../../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { GigsawListComponent, GigsawListItemComponent } from '../../../../shared/ui/gigsaw';
import { Band, BandMember } from '../../models/band.models';
import { BandService } from '../../services/band.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-band-team-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [NativeUiModule, GigsawFormControlsModule, GigsawListComponent, GigsawListItemComponent],
  templateUrl: './band-team-settings.component.html',
  styleUrl: './band-team-settings.component.scss',
})
export class BandTeamSettingsComponent implements OnChanges {
  @Input({ required: true }) band!: Band;
  @Output() readonly reload = new EventEmitter<void>();
  private readonly bandService = inject(BandService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private get bandId(): number {
    return this.band.id;
  }
  private readonly auth = inject(AuthService);
  private readonly memberInstrumentDrafts = new Map<number, string>();
  readonly savingMemberInstruments = signal<number | null>(null);
  ngOnChanges(changes: SimpleChanges): void {
    const previous = changes['band']?.previousValue as Band | undefined;
    if (previous?.id !== this.band.id) {
      this.syncMemberInstrumentDrafts(this.band.members ?? []);
      return;
    }
    const members = this.band.members ?? [];
    for (const member of members) {
      const old = previous.members?.find((item) => item.id === member.id);
      if (
        !this.memberInstrumentDrafts.has(member.id) ||
        JSON.stringify(old?.instruments) !== JSON.stringify(member.instruments)
      ) {
        this.memberInstrumentDrafts.set(member.id, (member.instruments ?? []).join(', '));
      }
    }
    for (const id of this.memberInstrumentDrafts.keys()) {
      if (!members.some((member) => member.id === id)) this.memberInstrumentDrafts.delete(id);
    }
  }
  get isAdmin(): boolean {
    return this.band?.currentUserRole === 'ADMIN';
  }
  changeRoleValue(member: BandMember, role: string | string[]): void {
    const value = Array.isArray(role) ? role[0] : role;
    if (!value || value === member.role) return;
    this.updateRole(member, value);
  }

  canEditRole(member: BandMember): boolean {
    return member.id !== this.auth.currentUser()?.id;
  }

  private updateRole(member: BandMember, role: string): void {
    this.bandService
      .updateMemberRole(this.bandId, member.id, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          member.role = role;
          (await this.toast.create({ message: 'Ruolo aggiornato.', duration: 1600, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string } }) => {
          (
            await this.toast.create({
              message: error.error?.message || 'Aggiornamento ruolo non riuscito.',
              duration: 2200,
              color: 'danger',
            })
          ).present();
          this.reload.emit();
        },
      });
  }

  canEditInstruments(member: BandMember): boolean {
    return this.isAdmin || member.id === this.auth.currentUser()?.id;
  }

  memberInstrumentsDraft(member: BandMember): string {
    return this.memberInstrumentDrafts.get(member.id) ?? (member.instruments ?? []).join(', ');
  }

  updateMemberInstrumentsValue(member: BandMember, value: string): void {
    this.memberInstrumentDrafts.set(member.id, value);
  }

  saveMemberInstruments(member: BandMember): void {
    if (!this.canEditInstruments(member) || this.savingMemberInstruments() !== null) return;

    const instruments = this.parseInstruments(this.memberInstrumentsDraft(member));
    this.savingMemberInstruments.set(member.id);
    this.bandService
      .updateMemberInstruments(this.bandId, member.id, instruments)
      .pipe(finalize(() => this.savingMemberInstruments.set(null)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (updatedMember) => {
          member.instruments = updatedMember.instruments;
          this.memberInstrumentDrafts.set(member.id, (updatedMember.instruments ?? []).join(', '));
          (await this.toast.create({ message: 'Strumenti aggiornati.', duration: 1600, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string } }) => {
          (
            await this.toast.create({
              message: error.error?.message || 'Aggiornamento strumenti non riuscito.',
              duration: 2200,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  private syncMemberInstrumentDrafts(members: BandMember[]): void {
    this.memberInstrumentDrafts.clear();
    for (const member of members) {
      this.memberInstrumentDrafts.set(member.id, (member.instruments ?? []).join(', '));
    }
  }

  private parseInstruments(value: string): string[] {
    const seen = new Set<string>();
    return value
      .split(',')
      .map((instrument) => instrument.trim())
      .filter((instrument) => {
        const key = instrument.toLocaleLowerCase('it');
        if (!instrument || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20);
  }

  roleLabel(role?: string | null): string {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'BAND_MEMBER') return 'Membro band';
    return role || '—';
  }
}
