import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { BandContextService } from '../../../core/services/band-context.service';
import { BandResourceApiService } from '../../../core/services/band-resource-api.service';
import { SongService } from '../../songs/services/song.service';
import { RehearsalSessionService } from './rehearsal-session.service';

describe('RehearsalSessionService', () => {
  const session = { id: 1, title: 'Prova', date: '2026-10-03', status: 'confirmed' };
  let api: { get: jasmine.Spy };
  let songs: { list: jasmine.Spy };
  let service: RehearsalSessionService;

  beforeEach(() => {
    api = { get: jasmine.createSpy() };
    songs = { list: jasmine.createSpy().and.returnValue(of([{ id: 2, title: 'Secondo' }, { id: 3, title: 'Terzo' }])) };
    TestBed.configureTestingModule({ providers: [
      RehearsalSessionService,
      { provide: BandResourceApiService, useValue: api },
      { provide: BandContextService, useValue: { getCurrentBand: () => 7 } },
      { provide: SongService, useValue: songs },
    ] });
    service = TestBed.inject(RehearsalSessionService);
  });

  it('recupera i titoli dagli ID mantenendo l’ordine selezionato', async () => {
    api.get.and.returnValue(of({ ...session, songIds: [3, 2] }));
    const result = await firstValueFrom(service.get(1));
    expect(result.songs?.map((song) => song.title)).toEqual(['Terzo', 'Secondo']);
    expect(api.get).toHaveBeenCalledWith(7, 'rehearsal-sessions', 1);
  });

  it('usa i brani completi senza richiedere il repertorio', async () => {
    api.get.and.returnValue(of({ ...session, songs: [{ id: 2, title: 'Secondo' }] }));
    const result = await firstValueFrom(service.get(1));
    expect(result.songs).toEqual([{ id: 2, title: 'Secondo' }]);
    expect(songs.list).not.toHaveBeenCalled();
  });

  it('completa relazioni parziali e segnala i brani non disponibili', async () => {
    api.get.and.returnValue(of({ ...session, songIds: [2, 3, 4], songs: [{ id: 2, title: 'Titolo della prova' }] }));
    const result = await firstValueFrom(service.get(1));
    expect(result.songs?.map((song) => song.title)).toEqual(['Titolo della prova', 'Terzo', 'Brano non disponibile']);
  });

  it('rispetta una selezione vuota anche in presenza di dettagli precedenti', async () => {
    api.get.and.returnValue(of({ ...session, songIds: [], songs: [{ id: 2, title: 'Secondo' }] }));
    const result = await firstValueFrom(service.get(1));
    expect(result.songs).toEqual([]);
    expect(songs.list).not.toHaveBeenCalled();
  });
});
