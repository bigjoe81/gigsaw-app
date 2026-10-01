import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PosterTemplate, PosterTemplateDocument } from '../models/poster-template.models';

const STORAGE_KEY = 'gigsaw.poster-templates.v1';
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

export type AiPosterStyle = 'vintage' | 'rock' | 'blues' | 'modern' | 'elegant';
export type AiPosterFormat = 'poster' | 'story' | 'square' | 'landscape';

export interface AiPosterSafeArea {
  name: 'title' | 'details';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AiPosterGeneration {
  template: {
    id: number;
    gig_id: number;
    band_id: number;
    style: AiPosterStyle;
    format: AiPosterFormat;
    image_url: string;
    safe_areas: AiPosterSafeArea[];
  };
  ai_quota: {
    limit: number;
    used: number;
    remaining: number;
  };
}

@Injectable({ providedIn: 'root' })
export class PosterTemplateService {
  constructor(private readonly http: HttpClient) {}

  list(bandId: string): PosterTemplate[] {
    return this.read().filter((item) => item.bandId === bandId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(bandId: string, id: string): PosterTemplate | undefined {
    return this.list(bandId).find((item) => item.id === id);
  }

  save(bandId: string, name: string, document: PosterTemplateDocument, id?: string): PosterTemplate {
    const templates = this.read();
    const now = new Date().toISOString();
    const index = id ? templates.findIndex((item) => item.id === id && item.bandId === bandId) : -1;
    const item: PosterTemplate = {
      id: index >= 0 ? templates[index].id : this.createId(),
      bandId,
      name: name.trim(),
      createdAt: index >= 0 ? templates[index].createdAt : now,
      updatedAt: now,
      document: structuredClone(document),
    };
    if (index >= 0) templates[index] = item;
    else templates.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return item;
  }

  delete(bandId: string, id: string): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(
      this.read().filter((item) => item.bandId !== bandId || item.id !== id),
    ));
  }

  generateAi(gigId: number, style: AiPosterStyle, format: AiPosterFormat): Observable<AiPosterGeneration> {
    return this.http.post<{ data: AiPosterGeneration }>(
      `${API_BASE_URL}/gigs/${gigId}/poster-templates`,
      { style, format },
    ).pipe(map((response) => response.data));
  }

  async imageUrlToDataUrl(url: string): Promise<string> {
    const blob = await this.http.get(url, { responseType: 'blob' }).toPromise();
    if (!blob) throw new Error('Immagine AI non disponibile.');

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Impossibile leggere l’immagine AI.'));
      reader.readAsDataURL(blob);
    });
  }

  private read(): PosterTemplate[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(value) ? value as PosterTemplate[] : [];
    } catch {
      return [];
    }
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
