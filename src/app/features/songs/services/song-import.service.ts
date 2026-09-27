import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SongImportInput, SongImportKind, SongImportResult, SongImportReview, SongImportRow } from '../models/song-import.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class SongImportService {
  constructor(private readonly http: HttpClient) {}

  review(kind: SongImportKind, bandId: number, file: File): Observable<SongImportReview> {
    const form = new FormData();
    form.append('band_id', String(bandId));
    form.append('file', file, file.name);
    return this.http.post<ApiEnvelope<unknown>>(`${API_BASE_URL}/songs/imports/${kind}/review`, form).pipe(
      map((response) => this.normalizeReview(this.unwrap(response))),
    );
  }

  confirm(kind: SongImportKind, importToken: string, rows: SongImportRowSelection[]): Observable<SongImportResult> {
    return this.http.post<ApiEnvelope<unknown>>(`${API_BASE_URL}/songs/imports/${kind}/confirm`, {
      import_token: importToken,
      rows: rows.map((row) => ({
        row_number: row.rowNumber,
        selected: row.selected,
        use_metadata: row.useMetadata,
        candidate_external_id: row.candidateExternalId || null,
        input: {
          title: row.input.title,
          performed_by: row.input.performedBy || null,
          key: row.input.key || null,
          duration: row.input.duration || null,
          bpm: row.input.bpm || null,
          album: row.input.album || null,
          notes: row.input.notes || null,
        },
      })),
    }).pipe(map((response) => this.fromSnakeCase(this.unwrap(response)) as SongImportResult));
  }

  completeMetadata(importToken: string, row: SongImportRowSelection): Observable<SongImportRow> {
    return this.http.post<ApiEnvelope<unknown>>(`${API_BASE_URL}/songs/imports/metadata`, {
      import_token: importToken,
      row_number: row.rowNumber,
      title: row.input.title,
      performed_by: row.input.performedBy || null,
    }).pipe(map((response) => {
      const refreshed = this.fromSnakeCase(this.unwrap(response)) as SongImportRow;
      return {
        ...refreshed,
        selected: refreshed.ready && !refreshed.duplicateExisting,
        useMetadata: (refreshed.candidates ?? []).length > 0,
        candidateExternalId: refreshed.recommendedCandidateExternalId ?? '',
      };
    }));
  }

  private normalizeReview(value: unknown): SongImportReview {
    const review = this.fromSnakeCase(value) as SongImportReview;
    review.rows = (review.rows ?? []).map((row) => ({
      ...row,
      candidates: row.candidates ?? [],
      errors: row.errors ?? [],
      selected: row.ready && !row.duplicateExisting,
      useMetadata: row.candidates.length > 0,
      candidateExternalId: row.recommendedCandidateExternalId ?? '',
    }));
    return review;
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    return typeof response === 'object' && response !== null && 'data' in response ? response.data : response;
  }

  private fromSnakeCase(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.fromSnakeCase(item));
    if (typeof value !== 'object' || value === null) return value;
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = this.fromSnakeCase(item);
      return result;
    }, {});
  }
}

export interface SongImportRowSelection {
  rowNumber: number;
  selected: boolean;
  useMetadata: boolean;
  candidateExternalId: string;
  input: SongImportInput;
}
