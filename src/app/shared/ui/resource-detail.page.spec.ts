import { DialogService, ToastService } from './native-ui';
import { Injector } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { RehearsalSessionService } from '../../features/rehearsal-sessions/services/rehearsal-session.service';
import { ResourceDetailPage } from './resource-detail.page';

describe('ResourceDetailPage', () => {
  function create(get: jasmine.Spy): ResourceDetailPage {
    const route = { snapshot: { data: { resource: { service: RehearsalSessionService, fields: [] } }, paramMap: { get: () => '1' } } };
    const injector = { get: () => ({ get }) };
    const page = new ResourceDetailPage(route as unknown as ActivatedRoute, {} as Router, injector as unknown as Injector, {} as DialogService, {} as ToastService);
    page.ngOnInit();
    return page;
  }
  it('termina il loader e aggiorna il riepilogo a ogni ingresso', () => {
    const get = jasmine.createSpy().and.returnValues(of({ id: 1, title: 'Prova' }), of({ id: 1, title: 'Prova aggiornata' }));
    const page = create(get);
    expect(page.loading()).toBeFalse();
    expect(page.display('title')).toBe('Prova');
    page.load();
    expect(page.display('title')).toBe('Prova aggiornata');
  });
  it('interrompe una richiesta bloccata e permette di riprovare', fakeAsync(() => {
    const get = jasmine.createSpy().and.returnValues(NEVER, of({ id: 1, title: 'Prova' }));
    const page = create(get);
    tick(15000);
    expect(page.loading()).toBeFalse();
    expect(page.error()).toContain('Riprova');
    page.load();
    expect(page.error()).toBe('');
    expect(page.display('title')).toBe('Prova');
  }));
});
