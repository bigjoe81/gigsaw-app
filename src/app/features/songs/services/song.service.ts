import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Song } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';
import { SongMetadataCandidate, SongMetadataDetail } from '../models/song.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class SongService extends BandScopedCrudService<Song> {
  private readonly http = inject(HttpClient);
  protected readonly resource = 'songs';

  searchMetadata(title: string, artist?: string): Observable<SongMetadataCandidate[]> {
    let params = new HttpParams().set('title', title.trim());
    if (artist?.trim()) params = params.set('artist', artist.trim());
    return this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${API_BASE_URL}/song-metadata/search`, { params }).pipe(
      map((response) => this.unwrapMetadata(response).map((item) => this.normalizeMetadata(item) as unknown as SongMetadataCandidate)),
    );
  }

  metadataDetail(recordingMbid: string): Observable<SongMetadataDetail> {
    return this.http.get<ApiEnvelope<Record<string, unknown>>>(`${API_BASE_URL}/song-metadata/musicbrainz/${recordingMbid}`).pipe(
      map((response) => this.normalizeMetadata(this.unwrapMetadata(response)) as unknown as SongMetadataDetail),
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
