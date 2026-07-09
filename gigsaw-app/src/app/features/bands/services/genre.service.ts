import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BandGenre } from '../models/band.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class GenreService {
  private readonly http = inject(HttpClient);

  list(): Observable<BandGenre[]> {
    return this.http.get<ApiEnvelope<BandGenre[]>>(`${API_BASE_URL}/genres`).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    return typeof response === 'object' && response !== null && 'data' in response
      ? response.data
      : response;
  }
}
