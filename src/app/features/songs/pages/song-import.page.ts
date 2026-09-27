import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, cloudUploadOutline, documentTextOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { BandContextService } from '../../../core/services/band-context.service';
import { PdfSongImportReview, SongImportRow, SongService } from '../services/song.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  templateUrl: './song-import.page.html',
})
export class SongImportPage {
  readonly review = signal<PdfSongImportReview | null>(null);
  readonly selectedRows = signal<Set<number>>(new Set());
  readonly analyzing = signal(false);
  readonly importing = signal(false);
  readonly error = signal('');
  readonly result = signal('');

  constructor(
    private readonly songsApi: SongService,
    private readonly bandContext: BandContextService,
    private readonly router: Router,
  ) {
    addIcons({ arrowBack, cloudUploadOutline, documentTextOutline });
  }

  chooseFile(input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.error.set('Seleziona un file PDF.');
      return;
    }
    const bandId = this.bandContext.activeBandId;
    if (!bandId) {
      this.error.set('Seleziona prima una band.');
      return;
    }

    this.error.set('');
    this.result.set('');
    this.review.set(null);
    this.analyzing.set(true);
    this.songsApi.reviewPdfImport(file, bandId).pipe(finalize(() => this.analyzing.set(false))).subscribe({
      next: (review) => {
        this.review.set(review);
        this.selectedRows.set(new Set(review.rows.filter((row) => row.ready && !row.duplicate_existing).map((row) => row.row_number)));
      },
      error: (error) => this.error.set(this.apiError(error, 'Non riesco ad analizzare il PDF.')),
    });
  }

  toggle(row: SongImportRow): void {
    if (!row.ready || row.duplicate_existing) return;
    const next = new Set(this.selectedRows());
    next.has(row.row_number) ? next.delete(row.row_number) : next.add(row.row_number);
    this.selectedRows.set(next);
  }

  isSelected(row: SongImportRow): boolean {
    return this.selectedRows().has(row.row_number);
  }

  confirm(): void {
    const review = this.review();
    if (!review || !this.selectedRows().size) return;

    this.error.set('');
    this.importing.set(true);
    this.songsApi.confirmPdfImport(review.import_token, review.rows.map((row) => ({
      row_number: row.row_number,
      selected: this.selectedRows().has(row.row_number),
      use_metadata: false,
    }))).pipe(finalize(() => this.importing.set(false))).subscribe({
      next: (result) => {
        this.result.set(`${result.created_count} ${result.created_count === 1 ? 'brano importato' : 'brani importati'}.`);
        setTimeout(() => void this.router.navigate(['/app/brani']), 700);
      },
      error: (error) => this.error.set(this.apiError(error, 'Importazione non riuscita.')),
    });
  }

  private apiError(error: any, fallback: string): string {
    if (error?.status === 429) return error?.error?.message || 'Hai raggiunto il limite beta di importazioni PDF con AI.';
    return error?.error?.message || error?.error?.error || fallback;
  }
}
