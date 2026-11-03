import { guidedCompletionUrl } from '../../../core/navigation/guided-navigation';
import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule, ToastService } from '../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../shared/ui/gigsaw/gigsaw-form-controls.module';
import { GigsawBadgeComponent } from '../../../shared/ui/gigsaw/gigsaw-badge.component';
import { GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw/gigsaw-list.component';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BandContextService } from '../../../core/services/band-context.service';
import { SongImportReview, SongImportRow, SongService } from '../services/song.service';

type ImportKind = 'document' | 'spreadsheet';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    NativeUiModule,
    GigsawFormControlsModule,
    GigsawBadgeComponent,
    GigsawListComponent,
    GigsawListItemComponent,
  ],
  templateUrl: './song-import.page.html',
})
export class SongImportPage {
  readonly review = signal<SongImportReview | null>(null);
  readonly selectedRows = signal<Set<number>>(new Set());
  readonly analyzing = signal(false);
  readonly importing = signal(false);
  readonly normalizeTitles = signal(false);
  readonly importKind = signal<ImportKind>('document');
  readonly durations = signal<Record<number, number>>({});
  readonly searching = signal<Set<number>>(new Set());

  constructor(
    private readonly songsApi: SongService,
    private readonly bandContext: BandContextService,
    private readonly router: Router,
    private readonly toast: ToastService,
  ) {

  }

  chooseFile(input: HTMLInputElement): void {
    input.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (this.analyzing() || this.importing()) return;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const name = file.name.toLowerCase();
    const isDocument = /\.(pdf|docx)$/.test(name) || file.type === 'application/pdf';
    const isSpreadsheet = /\.(csv|txt|xls|xlsx)$/.test(name);
    if (!isDocument && !isSpreadsheet) {
      await this.showToast('Formato non supportato. Usa PDF, Word DOCX, Excel, CSV o TXT.', 'error');
      return;
    }

    const bandId = this.bandContext.activeBandId;
    if (!bandId) {
      await this.showToast('Seleziona prima una band.', 'error');
      return;
    }

    this.importKind.set(isDocument ? 'document' : 'spreadsheet');
    this.review.set(null);
    this.durations.set({});
    this.analyzing.set(true);

    const request = isDocument
      ? this.songsApi.reviewDocumentImport(file, bandId)
      : this.songsApi.reviewSpreadsheetImport(file, bandId);

    request.pipe(finalize(() => this.analyzing.set(false))).subscribe({
      next: (review) => {
        this.review.set(review);
        this.selectedRows.set(new Set(review.rows.filter((row) => row.ready && !row.duplicate_existing).map((row) => row.row_number)));
      },
      error: async (error) => {
        await this.showToast(this.apiError(error, 'Non riesco ad analizzare il file.'), 'error');
      },
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
    if (!review || !this.selectedRows().size || this.importing()) return;

    this.importing.set(true);
    const rows = review.rows.map((row) => ({
      row_number: row.row_number,
      selected: this.selectedRows().has(row.row_number),
      use_metadata: false,
      input: { title: this.displayTitle(row), performed_by: this.displayArtist(row), duration: this.durationOf(row) },
    }));
    const request = this.importKind() === 'document'
      ? this.songsApi.confirmDocumentImport(review.import_token, rows)
      : this.songsApi.confirmSpreadsheetImport(review.import_token, rows);

    request.pipe(finalize(() => this.importing.set(false))).subscribe({
      next: async (result) => {
        if (!result.created_count) {
          await this.showToast('Nessun brano salvato. Verifica i dati delle righe selezionate prima di riprovare.', 'error');
          return;
        }
        if (result.skipped_count) {
          await this.showToast(
            `${result.created_count} brani importati, ${result.skipped_count} non salvati. Torna al repertorio per controllare i brani importati.`,
            'warning',
            3500,
          );
          this.selectedRows.set(new Set());
          return;
        }
        await this.showToast(
          `${result.created_count} ${result.created_count === 1 ? 'brano importato' : 'brani importati'}.`,
          'success',
          4500,
        );
        const bandId = this.bandContext.activeBandId;
        const destination = guidedCompletionUrl(this.router.url, bandId ?? undefined, 'importazione');
        setTimeout(() => {
          if (destination) void this.router.navigateByUrl(destination);
          else void this.router.navigate(bandId ? ['/band', bandId, 'repertorio'] : ['/band']);
        }, 700);
      },
      error: async (error) => {
        await this.showToast(this.apiError(error, 'Importazione non riuscita.'), 'error');
      },
    });
  }

  durationOf(row: SongImportRow): number {
    return this.durations()[row.row_number] ?? (Number(row.input.duration) || 0);
  }

  durationLabel(row: SongImportRow): string {
    const seconds = this.durationOf(row);
    return seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '';
  }

  setDuration(row: SongImportRow, value: string): void {
    const parts = value.trim().split(':').map(Number);
    const valid = value.trim() !== '' && parts.length <= 2 && parts.every((part) => Number.isFinite(part) && part >= 0);
    const seconds = !valid ? 0 : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
    this.durations.update((current) => ({ ...current, [row.row_number]: Math.round(seconds) }));
  }

  searchDuration(row: SongImportRow): void {
    const title = this.displayTitle(row).trim();
    if (!title || this.searching().has(row.row_number)) return;

    this.searching.update((set) => new Set(set).add(row.row_number));
    this.songsApi.searchMetadata(title, this.displayArtist(row))
      .pipe(finalize(() => this.searching.update((set) => {
        const next = new Set(set);
        next.delete(row.row_number);
        return next;
      })))
      .subscribe({
        next: async (candidates) => {
          const found = candidates.find((candidate) => (candidate.durationSeconds ?? 0) > 0);
          if (!found) {
            await this.showToast(`Nessuna durata trovata per “${title}”. Inseriscila a mano.`, 'warning');
            return;
          }
          this.durations.update((current) => ({ ...current, [row.row_number]: Math.round(found.durationSeconds as number) }));
        },
        error: async (error) => {
          await this.showToast(this.apiError(error, 'Ricerca metadati non riuscita.'), 'error');
        },
      });
  }

  displayTitle(row: SongImportRow): string {
    const title = row.input.title || '';
    if (!this.normalizeTitles() || title !== title.toLocaleUpperCase('it') || title === title.toLocaleLowerCase('it')) return title;
    return title.toLocaleLowerCase('it').replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase('it'));
  }

  displayArtist(row: SongImportRow): string {
    const artist = row.input.performed_by || '';
    if (!this.normalizeTitles() || artist !== artist.toLocaleUpperCase('it') || artist === artist.toLocaleLowerCase('it')) return artist;
    return artist.toLocaleLowerCase('it').replace(/(^|[\s'’.\-/&])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase('it'));
  }

  private apiError(error: any, fallback: string): string {
    if (error?.status === 429) return error?.error?.message || 'Hai raggiunto il limite beta di importazioni con AI.';
    return error?.error?.message || error?.error?.error || fallback;
  }

  private async showToast(
    message: string,
    tone: 'success' | 'warning' | 'error',
    duration = 5000,
  ): Promise<void> {
    const toast = await this.toast.create({ message, tone, duration });
    await toast.present();
  }
}
