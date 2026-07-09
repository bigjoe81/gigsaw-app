import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Setlist } from '../../../core/models/band-resources.models';
import { BandContextService } from '../../../core/services/band-context.service';
import { SetlistGeneratePayload, SetlistTemplate, SetlistUpsertPayload } from '../models/setlist.models';

type ApiEnvelope<T> = T | { data: T };

const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class SetlistService {
  private readonly http = inject(HttpClient);
  private readonly bandContext = inject(BandContextService);

  list(): Observable<Setlist[]> {
    return this.withBand((bandId) =>
      this.http.get<ApiEnvelope<Setlist[]>>(`${API_BASE_URL}/bands/${bandId}/setlists`).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  get(id: number): Observable<Setlist> {
    return this.withBand((bandId) =>
      this.http.get<ApiEnvelope<Setlist>>(`${API_BASE_URL}/bands/${bandId}/setlists/${id}`).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  create(payload: SetlistUpsertPayload): Observable<Setlist> {
    return this.withBand((bandId) =>
      this.http.post<ApiEnvelope<Setlist>>(`${API_BASE_URL}/bands/${bandId}/setlists`, this.toApi(payload)).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  update(id: number, payload: SetlistUpsertPayload): Observable<Setlist> {
    return this.withBand((bandId) =>
      this.http.put<ApiEnvelope<Setlist>>(`${API_BASE_URL}/bands/${bandId}/setlists/${id}`, this.toApi(payload)).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.withBand((bandId) => this.http.delete<void>(`${API_BASE_URL}/bands/${bandId}/setlists/${id}`));
  }

  generate(payload: SetlistGeneratePayload): Observable<Setlist> {
    return this.withBand((bandId) =>
      this.http.post<ApiEnvelope<Setlist>>(`${API_BASE_URL}/bands/${bandId}/setlists/generate`, this.toApi(payload)).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  pdf(id: number): Observable<Blob> {
    return this.withBand((bandId) =>
      this.http.get(`${API_BASE_URL}/bands/${bandId}/setlists/${id}/pdf`, {
        responseType: 'blob',
      }),
    );
  }

  listTemplates(): Observable<SetlistTemplate[]> {
    return this.withBand((bandId) =>
      this.http.get<ApiEnvelope<SetlistTemplate[]>>(`${API_BASE_URL}/bands/${bandId}/setlist-templates`).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  getTemplate(id: number): Observable<SetlistTemplate> {
    return this.withBand((bandId) =>
      this.http.get<ApiEnvelope<SetlistTemplate>>(`${API_BASE_URL}/bands/${bandId}/setlist-templates/${id}`).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  createTemplate(payload: Partial<SetlistTemplate>): Observable<SetlistTemplate> {
    return this.withBand((bandId) =>
      this.http.post<ApiEnvelope<SetlistTemplate>>(`${API_BASE_URL}/bands/${bandId}/setlist-templates`, this.toApi(payload)).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  updateTemplate(id: number, payload: Partial<SetlistTemplate>): Observable<SetlistTemplate> {
    return this.withBand((bandId) =>
      this.http.put<ApiEnvelope<SetlistTemplate>>(`${API_BASE_URL}/bands/${bandId}/setlist-templates/${id}`, this.toApi(payload)).pipe(
        map((response) => this.unwrap(response)),
      ),
    );
  }

  deleteTemplate(id: number): Observable<void> {
    return this.withBand((bandId) => this.http.delete<void>(`${API_BASE_URL}/bands/${bandId}/setlist-templates/${id}`));
  }

  private withBand<R>(operation: (bandId: number) => Observable<R>): Observable<R> {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? operation(bandId) : throwError(() => new Error('Nessuna band attiva selezionata.'));
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    const payload = typeof response === 'object' && response !== null && 'data' in response
      ? response.data
      : response;

    return this.fromApi(payload) as T;
  }

  private toApi<T>(payload: T): Record<string, unknown> {
    return this.toApiValue(payload) as Record<string, unknown>;
  }

  private fromApi(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.fromApi(item));
    if (typeof value !== 'object' || value === null) return value;

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = this.fromApi(item);
      return result;
    }, {});
  }

  private toApiValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.toApiValue(item));
    if (typeof value !== 'object' || value === null) return value;

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      if (item !== null && item !== undefined && item !== '') {
        result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = this.toApiValue(item);
      }

      return result;
    }, {});
  }
}
