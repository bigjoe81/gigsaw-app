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
  it('raggruppa varianti e rinomina tutti i formati mantenendo i documenti', () => {
    const post = service.save('band-1', 'Tour', document);
    const storyDocument = { ...document, format: { ...POSTER_FORMATS[1] } };
    const story = service.save('band-1', 'Tour', storyDocument, undefined, post.groupId);
    service.save('band-1', 'Tour 2027', storyDocument, story.id);
    expect(service.list('band-1').every(item => item.name === 'Tour 2027')).toBeTrue();
    expect(service.get('band-1', post.id)?.document.format.id).toBe('instagram-post');
    service.deleteGroup('band-1', post.groupId!);
    expect(service.list('band-1')).toEqual([]);
  });

  it('raggruppa template precedenti con lo stesso nome senza cambiare gli id', () => {
    localStorage.setItem('gigsaw.poster-templates.v1', JSON.stringify([
      { id: 'old-post', bandId: 'band-1', name: 'Tour', createdAt: '2026', updatedAt: '2026', document },
      { id: 'old-story', bandId: 'band-1', name: 'Tour', createdAt: '2026', updatedAt: '2026', document: { ...document, format: POSTER_FORMATS[1] } },
    ]));
    const templates = service.list('band-1');
    expect(templates.map(item => item.id)).toEqual(['old-post', 'old-story']);
    expect(templates[0].groupId).toBe(templates[1].groupId);
  });

});
