import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, cloudUploadOutline, documentTextOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { BandContextService } from '../../../core/services/band-context.service';
import { SongImportReview, SongImportRow, SongService } from '../services/song.service';

type ImportKind = 'pdf' | 'spreadsheet';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSpinner, IonTitle, IonToolbar],
  templateUrl: './song-import.page.html',
})
export class SongImportPage {
  readonly review = signal<SongImportReview | null>(null);
  readonly selectedRows = signal<Set<number>>(new Set());
  readonly analyzing = signal(false);
  readonly importing = signal(false);
  readonly error = signal('');
  readonly result = signal('');
  readonly importKind = signal<ImportKind>('pdf');

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

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';
    const isSpreadsheet = /\.(csv|txt|xls|xlsx)$/.test(name);
    if (!isPdf && !isSpreadsheet) {
      this.error.set('Formato non supportato. Usa PDF, Excel, CSV o TXT.');
      return;
    }

    const bandId = this.bandContext.activeBandId;
    if (!bandId) {
      this.error.set('Seleziona prima una band.');
      return;
    }

    this.importKind.set(isPdf ? 'pdf' : 'spreadsheet');
    this.error.set('');
    this.result.set('');
    this.review.set(null);
    this.analyzing.set(true);

    const request = isPdf
      ? this.songsApi.reviewPdfImport(file, bandId)
      : this.songsApi.reviewSpreadsheetImport(file, bandId);

    request.pipe(finalize(() => this.analyzing.set(false))).subscribe({
      next: (review) => {
        this.review.set(review);
        this.selectedRows.set(new Set(review.rows.filter((row) => row.ready && !row.duplicate_existing).map((row) => row.row_number)));
      },
      error: (error) => this.error.set(this.apiError(error, 'Non riesco ad analizzare il file.')),
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
    const rows = review.rows.map((row) => ({
      row_number: row.row_number,
      selected: this.selectedRows().has(row.row_number),
      use_metadata: false,
    }));
    const request = this.importKind() === 'pdf'
      ? this.songsApi.confirmPdfImport(review.import_token, rows)
      : this.songsApi.confirmSpreadsheetImport(review.import_token, rows);

    request.pipe(finalize(() => this.importing.set(false))).subscribe({
      next: (result) => {
        this.result.set(`${result.created_count} ${result.created_count === 1 ? 'brano importato' : 'brani importati'}.`);
        const bandId = this.bandContext.activeBandId;
        setTimeout(() => void this.router.navigate(bandId ? ['/band', bandId, 'repertorio'] : ['/band']), 700);
      },
      error: (error) => this.error.set(this.apiError(error, 'Importazione non riuscita.')),
    });
  }

  private apiError(error: any, fallback: string): string {
    if (error?.status === 429) return error?.error?.message || 'Hai raggiunto il limite beta di importazioni con AI.';
    return error?.error?.message || error?.error?.error || fallback;
  }
}
