import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceKey } from '../models/band-resources.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class BandResourceApiService {
  constructor(private readonly http: HttpClient) {}

  list<T extends { id: number }>(bandId: number, resource: ResourceKey): Observable<T[]> {
    const endpoint = this.endpoint(resource, bandId);
    return this.http.get<ApiEnvelope<T[]>>(endpoint.collection, { params: this.listParams(resource, bandId) }).pipe(map((response) => this.unwrap(response)));
  }

  get<T extends { id: number }>(bandId: number, resource: ResourceKey, id: number): Observable<T> {
    return this.http.get<ApiEnvelope<T>>(this.itemUrl(resource, bandId, id)).pipe(map((response) => this.unwrap(response)));
  }

  create<T extends { id: number }>(bandId: number, resource: ResourceKey, payload: Partial<T>): Observable<T> {
    return this.http.post<ApiEnvelope<T>>(this.endpoint(resource, bandId).collection, this.toApi(resource, bandId, payload)).pipe(map((response) => this.unwrap(response)));
  }

  update<T extends { id: number }>(bandId: number, resource: ResourceKey, id: number, payload: Partial<T>): Observable<T> {
    return this.http.put<ApiEnvelope<T>>(this.itemUrl(resource, bandId, id), this.toApi(resource, bandId, payload)).pipe(map((response) => this.unwrap(response)));
  }

  delete(bandId: number, resource: ResourceKey, id: number): Observable<void> {
    return this.http.delete<void>(this.itemUrl(resource, bandId, id));
  }

  private endpoint(resource: ResourceKey, bandId: number): { collection: string } {
    if (resource === 'setlists') {
      return { collection: `${API_BASE_URL}/bands/${bandId}/setlists` };
    }

    const pathByResource: Record<ResourceKey, string> = {
      songs: 'songs',
      'rehearsal-sessions': 'rehearses',
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
    if (resource === 'songs') {
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

  /** Laravel resources conventionally use snake_case; pages use TypeScript camelCase. */
  private toApi<T>(resource: ResourceKey, bandId: number, payload: Partial<T>): Record<string, unknown> {
    const result = Object.entries(payload as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = value;
      }
      return result;
    }, {});

    if (resource === 'songs') {
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
