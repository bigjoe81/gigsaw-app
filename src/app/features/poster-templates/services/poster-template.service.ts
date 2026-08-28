import { Injectable } from '@angular/core';
import { PosterTemplate, PosterTemplateDocument } from '../models/poster-template.models';

const STORAGE_KEY = 'gigsaw.poster-templates.v1';

@Injectable({ providedIn: 'root' })
export class PosterTemplateService {
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
