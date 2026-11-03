import { GigPostersComponent } from './gig-posters.component';
import { POSTER_FORMATS, PosterTemplateDocument } from '../models/poster-template.models';
import { PosterTemplateService } from '../services/poster-template.service';
import { a4Pdf } from '../services/poster-export';

describe('Locandine compilate del concerto', () => {
  beforeEach(() => localStorage.clear());

  it('conserva la copia compilata anche dopo modifica o eliminazione del modello e isola i concerti', () => {
    const service = new PosterTemplateService();
    const document: PosterTemplateDocument = {
      version: 1, format: { ...POSTER_FORMATS[3] }, backgroundDataUrl: null,
      fields: [{ id: 'title', key: 'eventName', label: 'Evento', sampleValue: 'ESEMPIO', x: 0, y: 0, width: 500,
        fontFamily: 'Arial', fontSize: 50, color: '#fff', textAlign: 'center', uppercase: false }],
    };
    const model = service.save('1', 'Stampa', document);
    const component = new GigPostersComponent(service);
    component.bandId = '1';
    component.values = { title: 'Live al Bloom', date: '2026-10-01', time: '21:30', venue: 'Bloom', city: 'Milano', address: 'Via Roma', admission: '€ 10' };
    component.ngOnChanges({ bandId: true });
    component.select([model.id]);
    component.persist(42);
    expect(service.get('1', model.id)?.document.fields[0].sampleValue).toBe('ESEMPIO');
    service.delete('1', model.id);
    component.gigId = 42;
    component.ngOnChanges({ gigId: true });
    expect(component.posters[0].document.fields[0].sampleValue).toBe('Live al Bloom');
    expect(component.missingModels.length).toBe(1);
    component.values.title = 'Nuovo titolo';
    expect(component.posters[0].document.fields[0].sampleValue).toBe('Live al Bloom');
    component.refresh(0);
    expect(component.posters[0].document.fields[0].sampleValue).toBe('Nuovo titolo');
    component.gigId = 43;
    component.ngOnChanges({ gigId: true });
    expect(component.posters).toEqual([]);
  });

  it('genera un PDF A4 con riferimenti e offset validi anche per byte immagine non ASCII', async () => {
    const blob = a4Pdf(new Uint8Array([255, 216, 0, 128, 255, 217]), 2480, 3508);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    expect(blob.type).toBe('application/pdf');
    expect(text).toContain('/MediaBox [0 0 595.2756 841.8898]');
    expect(text).toContain('/Width 2480 /Height 3508');
    const xref = Number(text.match(/startxref\n(\d+)/)?.[1]);
    expect(new TextDecoder().decode(bytes.slice(xref, xref + 4))).toBe('xref');
    const entries = text.slice(xref).split('\n').slice(3, 8);
    entries.forEach((entry, index) => {
      const offset = Number(entry.slice(0, 10));
      expect(new TextDecoder().decode(bytes.slice(offset, offset + 7))).toBe(`${index + 1} 0 obj`);
    });
  });
});
