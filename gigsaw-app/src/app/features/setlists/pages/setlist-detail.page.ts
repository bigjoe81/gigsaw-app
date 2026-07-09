
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { BandMember } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { Setlist } from '../../../core/models/band-resources.models';
import { SetlistPdfService } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSpinner,
    IonSkeletonText,
    IonTitle,
    IonToolbar
],
  templateUrl: './setlist-detail.page.html',
})
export class SetlistDetailPage implements OnInit {
  setlist?: Setlist;
  loading = true;
  pdfLoading = false;
  bandMembers: BandMember[] = [];
  private id!: number;
  private bandId?: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bandApi: BandService,
    private readonly setlistPdf: SetlistPdfService,
    private readonly setlistsApi: SetlistService,
    private readonly alert: AlertController,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.bandId = this.getBandId();
    if (this.bandId) {
      this.bandApi.get(this.bandId).subscribe({
        next: (band) => {
          this.bandMembers = band.members ?? [];
        },
      });
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.setlistsApi.get(this.id).subscribe({
      next: (setlist) => {
        this.setlist = setlist;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  songSubtitle(song: NonNullable<Setlist['songs']>[number]): string {
    return [song.key, song.bpm ? `${song.bpm} bpm` : '', song.linkGroup ? `Link: ${song.linkGroup}` : '']
      .filter(Boolean)
      .join(' · ');
  }

  songNotes(song: NonNullable<Setlist['songs']>[number]): string[] {
    return [
      song.notes ? `Note brano: ${song.notes}` : '',
      song.setlistNotes ? `Note scaletta: ${song.setlistNotes}` : '',
      ...(song.memberNotes ?? []).map((memberNote) => `${this.memberName(memberNote.userId)}: ${memberNote.notes}`),
    ].filter(Boolean);
  }

  openingSongs(): NonNullable<Setlist['songs']> {
    return this.segmentSongs(this.setlist?.generation?.openingSongIds ?? []);
  }

  closingSongs(): NonNullable<Setlist['songs']> {
    return this.segmentSongs(this.setlist?.generation?.closingSongIds ?? []);
  }

  encoreSongs(): NonNullable<Setlist['songs']> {
    return this.segmentSongs(this.setlist?.generation?.encoreSongIds ?? []);
  }

  mainSongs(): NonNullable<Setlist['songs']> {
    const excluded = new Set([
      ...(this.setlist?.generation?.openingSongIds ?? []),
      ...(this.setlist?.generation?.closingSongIds ?? []),
      ...(this.setlist?.generation?.encoreSongIds ?? []),
    ]);

    return (this.setlist?.songs ?? []).filter((song) => !excluded.has(song.id));
  }

  private segmentSongs(songIds: number[]): NonNullable<Setlist['songs']> {
    const ids = new Set(songIds);
    return (this.setlist?.songs ?? []).filter((song) => ids.has(song.id));
  }

  formatSeconds(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  formatRatio(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${Math.round(value * 100)}%`;
  }

  openPdf(): void {
    this.pdfLoading = true;

    this.setlistPdf.open(this.id, this.setlist?.title).then(async () => {
        this.pdfLoading = false;
      }).catch(async (error: Error) => {
        this.pdfLoading = false;
        (await this.toast.create({
          message: error.message || 'Impossibile aprire il PDF.',
          duration: 2200,
          color: 'danger',
        })).present();
      });
  }

  sharePdf(): void {
    this.pdfLoading = true;

    this.setlistPdf.share(this.id, this.setlist?.title).then(async () => {
      this.pdfLoading = false;
      }).catch(async (error: Error) => {
        this.pdfLoading = false;
        (await this.toast.create({
          message: error.message || 'Impossibile condividere il PDF.',
          duration: 2200,
          color: 'danger',
        })).present();
      });
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare setlist?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.setlistsApi.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Setlist eliminata.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private memberName(userId: number): string {
    return this.bandMembers.find((member) => member.id === userId)?.name ?? `Membro #${userId}`;
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
  }
}
