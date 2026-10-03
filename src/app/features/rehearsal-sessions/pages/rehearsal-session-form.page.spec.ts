import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { SongService } from '../../songs/services/song.service';
import { RehearsalRoomService } from '../services/rehearsal-room.service';
import { RehearsalSessionService } from '../services/rehearsal-session.service';
import { RehearsalSessionFormPage } from './rehearsal-session-form.page';

describe('RehearsalSessionFormPage', () => {
  it('salva la rimozione e ricarica la selezione quando si riapre la pagina', () => {
    const session = { id: 1, date: '2026-10-03', status: 'confirmed', rehearsalRoomId: 5, songIds: [2, 3] };
    const sessions = {
      get: jasmine.createSpy().and.returnValues(of(session), of({ ...session, songIds: [3] }), of({ ...session, songIds: [] })),
      update: jasmine.createSpy().and.returnValue(of(session)),
    };
    const route = { snapshot: { paramMap: { get: (key: string) => key === 'id' ? '1' : '7' } } };
    const page = new RehearsalSessionFormPage(
      new FormBuilder(), sessions as unknown as RehearsalSessionService,
      { list: () => of([{ id: 5, name: 'Sala' }]) } as unknown as RehearsalRoomService,
      { list: () => of([{ id: 2, title: 'A' }, { id: 3, title: 'B' }]) } as unknown as SongService,
      route as unknown as ActivatedRoute,
      { navigateByUrl: () => Promise.resolve(true) } as unknown as Router,
      { create: () => Promise.resolve({ present: () => Promise.resolve() }) } as unknown as ToastController,
    );
    page.ngOnInit();
    page.ionViewWillEnter();
    page.toggleSong(2, false);
    page.save();
    expect(sessions.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ songIds: [3] }));
    page.ionViewWillEnter();
    expect(page.selectedSongIds()).toEqual([3]);
    page.toggleSong(3, false);
    page.save();
    expect(sessions.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ songIds: [] }));
    page.ionViewWillEnter();
    expect(page.selectedSongIds()).toEqual([]);
  });
});
