import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BandGenre } from '../models/band.models';

const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class GenreService {
  private readonly http = inject(HttpClient);

  list(): Observable<BandGenre[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/genres`).pipe(
      map((response) => this.unwrapGenres(response)),
    );
  }

  private unwrapGenres(response: unknown): BandGenre[] {
    let value = response;

    while (typeof value === 'object' && value !== null && !Array.isArray(value) && 'data' in value) {
      value = (value as { data: unknown }).data;
    }

    if (!Array.isArray(value)) {
      throw new Error('Formato della risposta genres non valido.');
    }

    return value as BandGenre[];
  }
}
