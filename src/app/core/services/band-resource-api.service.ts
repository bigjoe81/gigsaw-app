import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceKey } from '../models/band-resources.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class BandResourceApiService {
  constructor(private readonly http: HttpClient) {}

  list<T extends { id: number }>(bandId: number, resource: ResourceKey): Observable<T[]> {
    const endpoint = this.endpoint(resource, bandId);
    const request = this.http.get<ApiEnvelope<T[]>>(endpoint.collection, { params: this.listParams(resource, bandId) }).pipe(map((response) => this.unwrapList<T>(response)));
    const fallback = this.http.get<ApiEnvelope<T[]>>(this.nestedSongUrl(bandId)).pipe(map((response) => this.unwrapList<T>(response)));
    return this.withSongFallback(resource, request, fallback);
  }

  get<T extends { id: number }>(bandId: number, resource: ResourceKey, id: number): Observable<T> {
    const request = this.http.get<ApiEnvelope<T>>(this.itemUrl(resource, bandId, id)).pipe(map((response) => this.unwrap(response)));
    const fallback = this.http.get<ApiEnvelope<T>>(`${this.nestedSongUrl(bandId)}/${id}`).pipe(map((response) => this.unwrap(response)));
    return this.withSongFallback(resource, request, fallback);
  }

  create<T extends { id: number }>(bandId: number, resource: ResourceKey, payload: Partial<T>): Observable<T> {
    const body = this.toApi(resource, bandId, payload);
    const request = this.http.post<ApiEnvelope<T>>(this.endpoint(resource, bandId).collection, body).pipe(map((response) => this.unwrap(response)));
    const fallback = this.http.post<ApiEnvelope<T>>(this.nestedSongUrl(bandId), body).pipe(map((response) => this.unwrap(response)));
    return this.withSongFallback(resource, request, fallback);
  }

  update<T extends { id: number }>(bandId: number, resource: ResourceKey, id: number, payload: Partial<T>): Observable<T> {
    const body = this.toApi(resource, bandId, payload);
    const request = this.http.put<ApiEnvelope<T>>(this.itemUrl(resource, bandId, id), body).pipe(map((response) => this.unwrap(response)));
    const fallback = this.http.put<ApiEnvelope<T>>(`${this.nestedSongUrl(bandId)}/${id}`, body).pipe(map((response) => this.unwrap(response)));
    return this.withSongFallback(resource, request, fallback);
  }

  delete(bandId: number, resource: ResourceKey, id: number): Observable<void> {
    const request = this.http.delete<void>(this.itemUrl(resource, bandId, id));
    const fallback = this.http.delete<void>(`${this.nestedSongUrl(bandId)}/${id}`);
    return this.withSongFallback(resource, request, fallback);
  }

  private endpoint(resource: ResourceKey, bandId: number): { collection: string } {
    if (resource === 'setlists') {
      return { collection: `${API_BASE_URL}/bands/${bandId}/setlists` };
    }

    const pathByResource: Record<ResourceKey, string> = {
      songs: 'songs',
      'rehearsal-sessions': 'rehearses',
      'rehearsal-rooms': 'rehearsal-rooms',
      'recording-sessions': 'recording-sessions',
      gigs: 'gigs',
      venues: 'venues',
      setlists: 'setlists',
    };

    return { collection: `${API_BASE_URL}/${pathByResource[resource]}` };
  }

  private itemUrl(resource: ResourceKey, bandId: number, id: number): string {
    return `${this.endpoint(resource, bandId).collection}/${id}`;
  }

  private listParams(resource: ResourceKey, bandId: number): Record<string, string> | undefined {
    if (resource === 'songs' || resource === 'gigs' || resource === 'rehearsal-sessions') {
      return { bandId: String(bandId) };
    }

    return undefined;
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    const payload = typeof response === 'object' && response !== null && 'data' in response
      ? response.data
      : response;
    return this.fromApi(payload) as T;
  }

  private unwrapList<T extends { id: number }>(response: ApiEnvelope<T[]>): T[] {
    let payload: unknown = response;
    while (typeof payload === 'object' && payload !== null && !Array.isArray(payload) && 'data' in payload) {
      payload = (payload as { data: unknown }).data;
    }
    if (!Array.isArray(payload)) throw new Error('Formato della lista non valido.');
    return this.fromApi(payload) as T[];
  }

  private nestedSongUrl(bandId: number): string {
    return `${API_BASE_URL}/bands/${bandId}/songs`;
  }

  private withSongFallback<T>(resource: ResourceKey, request: Observable<T>, fallback: Observable<T>): Observable<T> {
    if (resource !== 'songs') return request;
    return request.pipe(catchError((error: HttpErrorResponse) => error.status === 404 ? fallback : throwError(() => error)));
  }

  /** Laravel resources conventionally use snake_case; pages use TypeScript camelCase. */
  private toApi<T>(resource: ResourceKey, bandId: number, payload: Partial<T>): Record<string, unknown> {
    const result = Object.entries(payload as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, value]) => {
      if (value !== undefined && value !== '') {
        result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = value;
      }
      return result;
    }, {});

    if (resource === 'songs' || resource === 'gigs' || resource === 'rehearsal-sessions') {
      result['band_id'] = bandId;
    }

    return result;
  }

  private fromApi(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.fromApi(item));
    if (typeof value !== 'object' || value === null) return value;
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = this.fromApi(item);
      return result;
    }, {});
  }
}
