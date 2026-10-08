import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Song } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';
import { SongMetadataCandidate, SongMetadataDetail } from '../models/song.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

export interface SongImportRow {
  row_number: number;
  input: {
    title?: string;
    performed_by?: string;
    key?: string;
    duration?: number | string;
    bpm?: number | string;
    [key: string]: unknown;
  };
  lookup_status: string;
  duplicate_existing: boolean;
  ready: boolean;
  errors: string[];
  confidence?: number;
}

export interface SongImportReview {
  import_token: string;
  source: string;
  rows: SongImportRow[];
  summary: {
    total_rows: number;
    ready_rows: number;
    matched_rows: number;
    duplicate_rows: number;
  };
  ai_quota?: { limit: number; used: number; remaining: number };
}

export type PdfSongImportReview = SongImportReview;

export interface SongImportConfirmResult {
  created_count: number;
  skipped_count: number;
}

@Injectable({ providedIn: 'root' })
export class SongService extends BandScopedCrudService<Song> {
  private readonly http = inject(HttpClient);
  protected readonly resource = 'songs';

  reviewPdfImport(file: File, bandId: number): Observable<SongImportReview> {
    return this.reviewFile(`${API_BASE_URL}/songs/imports/pdf/review`, file, bandId);
  }

  reviewDocumentImport(file: File, bandId: number): Observable<SongImportReview> {
    return this.reviewFile(`${API_BASE_URL}/songs/imports/document/review`, file, bandId);
  }

  reviewSpreadsheetImport(file: File, bandId: number): Observable<SongImportReview> {
    return this.reviewFile(`${API_BASE_URL}/songs/imports/spreadsheet/review`, file, bandId);
  }

  confirmPdfImport(importToken: string, rows: Array<{ row_number: number; selected: boolean; use_metadata: boolean }>): Observable<SongImportConfirmResult> {
    return this.confirmImport(`${API_BASE_URL}/songs/imports/pdf/confirm`, importToken, rows);
  }

  confirmDocumentImport(importToken: string, rows: Array<{ row_number: number; selected: boolean; use_metadata: boolean }>): Observable<SongImportConfirmResult> {
    return this.confirmImport(`${API_BASE_URL}/songs/imports/document/confirm`, importToken, rows);
  }

  confirmSpreadsheetImport(importToken: string, rows: Array<{ row_number: number; selected: boolean; use_metadata: boolean }>): Observable<SongImportConfirmResult> {
    return this.confirmImport(`${API_BASE_URL}/songs/imports/spreadsheet/confirm`, importToken, rows);
  }

  searchMetadata(title: string, artist?: string): Observable<SongMetadataCandidate[]> {
    let params = new HttpParams().set('title', title.trim());
    if (artist?.trim()) params = params.set('artist', artist.trim());
    const normalize = (response: ApiEnvelope<Record<string, unknown>[]>) => {
      const payload = this.unwrapMetadata(response);
      if (!Array.isArray(payload)) throw new Error('Formato della ricerca metadati non valido.');
      return payload.map((item) => this.normalizeMetadata(item) as unknown as SongMetadataCandidate);
    };
    const fallback = this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${API_BASE_URL}/songs/metadata-lookup`, { params }).pipe(map(normalize));
    return this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${API_BASE_URL}/song-metadata/search`, { params }).pipe(
      map(normalize),
      catchError((error: { status?: number }) => error.status === 404 ? fallback : throwError(() => error)),
      timeout(20000),
    );
  }

  metadataDetail(recordingMbid: string): Observable<SongMetadataDetail> {
    return this.http.get<ApiEnvelope<Record<string, unknown>>>(`${API_BASE_URL}/song-metadata/musicbrainz/${recordingMbid}`).pipe(
      map((response) => this.normalizeMetadata(this.unwrapMetadata(response)) as unknown as SongMetadataDetail),
      timeout(20000),
    );
  }

  private reviewFile(endpoint: string, file: File, bandId: number): Observable<SongImportReview> {
    const body = new FormData();
    body.append('band_id', String(bandId));
    body.append('file', file, file.name);
    return this.http.post<ApiEnvelope<SongImportReview>>(endpoint, body).pipe(
      map((response) => this.unwrapMetadata(response)),
      timeout(120000),
    );
  }

  private confirmImport(endpoint: string, importToken: string, rows: Array<{ row_number: number; selected: boolean; use_metadata: boolean }>): Observable<SongImportConfirmResult> {
    return this.http.post<ApiEnvelope<SongImportConfirmResult>>(endpoint, {
      import_token: importToken,
      rows,
    }).pipe(
      map((response) => this.unwrapMetadata(response)),
      timeout(120000),
    );
  }

  private unwrapMetadata<T>(response: ApiEnvelope<T>): T {
    return typeof response === 'object' && response !== null && 'data' in response ? response.data : response;
  }

  private normalizeMetadata(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.normalizeMetadata(item));
    if (typeof value !== 'object' || value === null) return value;
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = this.normalizeMetadata(item);
      return result;
    }, {});
  }
}
