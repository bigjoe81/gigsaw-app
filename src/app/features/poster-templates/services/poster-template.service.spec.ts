import { TestBed } from '@angular/core/testing';
import { POSTER_FORMATS, PosterTemplateDocument } from '../models/poster-template.models';
import { PosterTemplateService } from './poster-template.service';

describe('PosterTemplateService', () => {
  let service: PosterTemplateService;
  const document: PosterTemplateDocument = { version: 1, format: { ...POSTER_FORMATS[0] }, backgroundDataUrl: null, fields: [] };

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(PosterTemplateService);
  });

  it('salva e isola i template per band', () => {
    service.save('band-1', 'Tour', document);
    service.save('band-2', 'Altro', document);
    expect(service.list('band-1').map((item) => item.name)).toEqual(['Tour']);
  });

  it('aggiorna un template senza cambiarne id e data di creazione', () => {
    const created = service.save('band-1', 'Prima', document);
    const updated = service.save('band-1', 'Dopo', document, created.id);
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(service.list('band-1').length).toBe(1);
  });

  it('elimina soltanto il template richiesto', () => {
    const first = service.save('band-1', 'Uno', document);
    service.save('band-1', 'Due', document);
    service.delete('band-1', first.id);
    expect(service.list('band-1').map((item) => item.name)).toEqual(['Due']);
  });
});
