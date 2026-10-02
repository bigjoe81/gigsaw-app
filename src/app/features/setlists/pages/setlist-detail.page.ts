import { SetlistPdfModalComponent } from '../components/setlist-pdf-modal.component';

import { Component, OnInit, signal } from '@angular/core';
import { finalize, timeout } from 'rxjs';
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
  IonNote,
  IonSpinner,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { BandMember } from '../../bands/models/band.models';
import { BandService } from '../../bands/services/band.service';
import { Setlist, SetlistItem } from '../../../core/models/band-resources.models';
import { SetlistPdfOptions } from '../models/setlist.models';
import { SetlistPdfService, SetlistPdfFormat } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';
import { GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw';

@Component({
  standalone: true,
  imports: [
    SetlistPdfModalComponent,
    RouterLink,
    GigsawListComponent,
    GigsawListItemComponent,
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
    IonNote,
    IonSpinner,
    IonSkeletonText,
    IonTitle,
    IonToolbar
],
  templateUrl: './setlist-detail.page.html',
})
export class SetlistDetailPage implements OnInit {
  readonly pdfOptions = signal<SetlistPdfOptions>({ includePerformedBy: true, includeKey: true, includeBpm: true });
  readonly pdfRequest = signal<'download' | 'share' | null>(null);

  confirmPdf(): void {
    const action = this.pdfRequest();
    this.pdfRequest.set(null);
    if (action === 'download') void this.downloadPdf();
    else if (action === 'share') this.sharePdf();
  }

  async downloadPdf(): Promise<void> {
    this.pdfLoading.set(true);
    try {
      await this.setlistPdf.download(this.id, this.setlist?.title, this.pdfFormat(), this.pdfOptions());
    } catch (error) {
      await (await this.toast.create({
        message: error instanceof Error ? error.message : 'Impossibile scaricare il PDF.',
        duration: 2200,
        color: 'danger',
      })).present();
    } finally {
      this.pdfLoading.set(false);
    }
  }

  readonly pdfFormat = signal<SetlistPdfFormat>('a4');
  setlist?: Setlist;
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly pdfLoading = signal(false);
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
    this.loading.set(true);
    this.loadError.set('');
    this.setlistsApi.get(this.id).pipe(
      timeout(15000),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (setlist) => {
        this.setlist = setlist;
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loadError.set(error.name === 'TimeoutError' ? 'Il server non risponde. Riprova.' : 'Impossibile caricare la scaletta.');
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

  mixedItemSong(item: SetlistItem) {
    return item.songId ? this.setlist?.songs?.find(song => song.id === item.songId) : undefined;
  }

  mixedItemLabel(item: SetlistItem): string {
    return item.type === 'pause' ? 'Pausa' : item.type === 'speech' ? 'Parlato' : item.type === 'stage-note' ? 'Nota palco' : 'Brano';
  }

  sectionSongs(ids: number[]): NonNullable<Setlist['songs']> {
    const songs = new Map((this.setlist?.songs ?? []).map(song => [song.id, song]));
    return ids.map(id => songs.get(id)).filter((song): song is NonNullable<typeof song> => !!song);
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
    this.pdfLoading.set(true);

    this.setlistPdf.open(this.id, this.setlist?.title, this.pdfFormat(), this.pdfOptions()).then(async () => {
        this.pdfLoading.set(false);
      }).catch(async (error: Error) => {
        this.pdfLoading.set(false);
        (await this.toast.create({
          message: error.message || 'Impossibile aprire il PDF.',
          duration: 2200,
          color: 'danger',
        })).present();
      });
  }

  sharePdf(): void {
    this.pdfLoading.set(true);

    this.setlistPdf.share(this.id, this.setlist?.title, this.pdfFormat(), this.pdfOptions()).then(async () => {
      this.pdfLoading.set(false);
      }).catch(async (error: Error) => {
        this.pdfLoading.set(false);
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
