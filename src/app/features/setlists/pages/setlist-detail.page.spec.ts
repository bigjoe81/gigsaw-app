import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { Setlist } from '../../../core/models/band-resources.models';
import { BandService } from '../../bands/services/band.service';
import { SetlistPdfService } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';
import { SetlistDetailPage } from './setlist-detail.page';

describe('Setlist detail reactive loading', () => {
  let response: Subject<Setlist>;
  let resolvePdf: () => void;

  beforeEach(async () => {
    response = new Subject<Setlist>();
    await TestBed.configureTestingModule({
      imports: [SetlistDetailPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } } },
        { provide: Router, useValue: {} },
        { provide: BandService, useValue: {} },
        { provide: SetlistService, useValue: { get: () => response } },
        { provide: SetlistPdfService, useValue: { open: () => new Promise<void>(resolve => resolvePdf = resolve) } },
        { provide: AlertController, useValue: {} },
        { provide: ToastController, useValue: {} },
      ],
    }).overrideComponent(SetlistDetailPage, {
      set: { imports: [], template: `@if (loading()) { Caricamento } @else if (loadError()) { Errore } @else { {{ setlist?.title }} } @if (pdfLoading()) { Preparazione PDF }` },
    }).compileComponents();
  });

  it('removes the loader after an asynchronous response without a user event', async () => {
    const fixture = TestBed.createComponent(SetlistDetailPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Caricamento');
    response.next({ id: 2, title: 'Scaletta salvata' });
    response.complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Scaletta salvata');
    expect(fixture.nativeElement.textContent).not.toContain('Caricamento');
  });

  it('replaces the loader with an error when the request fails', async () => {
    const fixture = TestBed.createComponent(SetlistDetailPage);
    await fixture.whenStable();
    response.error(new Error('Offline'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Errore');
    expect(fixture.nativeElement.textContent).not.toContain('Caricamento');
  });

  it('removes the PDF loader after the opening promise resolves', async () => {
    const fixture = TestBed.createComponent(SetlistDetailPage);
    await fixture.whenStable();
    response.next({ id: 2, title: 'Live' });
    response.complete();
    fixture.componentInstance.openPdf();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Preparazione PDF');
    resolvePdf();
    await Promise.resolve();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Preparazione PDF');
  });
});
