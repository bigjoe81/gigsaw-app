import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface MapboxAddressSuggestion {
  id: string;
  name: string;
  fullAddress: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface MapboxFeature {
  id: string;
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      place?: { name?: string };
      locality?: { name?: string };
      neighborhood?: { name?: string };
      region?: { name?: string };
      country?: { name?: string };
    };
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

@Injectable({ providedIn: 'root' })
export class MapboxGeocodingService {
  private readonly http = inject(HttpClient);
  private readonly accessToken = environment.mapboxAccessToken.trim();

  search(query: string): Observable<MapboxAddressSuggestion[]> {
    if (!this.accessToken || query.trim().length < 3) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', query.trim())
      .set('access_token', this.accessToken)
      .set('autocomplete', 'true')
      .set('limit', '5')
      .set('language', 'it,en')
      .set('types', 'address,street,place,locality,neighborhood');

    return this.http.get<MapboxResponse>('https://api.mapbox.com/search/geocode/v6/forward', { params }).pipe(
      map((response) => (response.features ?? []).map((feature) => this.toSuggestion(feature))),
    );
  }

  isConfigured(): boolean {
    return this.accessToken.length > 0;
  }

  private toSuggestion(feature: MapboxFeature): MapboxAddressSuggestion {
    const coordinates = feature.geometry?.coordinates;
    const address = feature.properties?.full_address ?? feature.properties?.name ?? '';
    const placeFormatted = feature.properties?.place_formatted ?? '';
    const fullAddress = [address, placeFormatted].filter(Boolean).join(', ');
    const city = feature.properties?.context?.place?.name
      ?? feature.properties?.context?.locality?.name
      ?? feature.properties?.context?.neighborhood?.name
      ?? null;

    return {
      id: feature.id,
      name: feature.properties?.name?.trim() || address || fullAddress,
      fullAddress: fullAddress || address,
      address,
      city,
      longitude: coordinates?.[0] ?? null,
      latitude: coordinates?.[1] ?? null,
    };
  }
}
