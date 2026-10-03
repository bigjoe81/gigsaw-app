import { FormBuilder } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BandContextService } from '../../../core/services/band-context.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { SongService } from '../../songs/services/song.service';
import { RehearsalRoomService } from '../services/rehearsal-room.service';
import { RehearsalSessionService } from '../services/rehearsal-session.service';
import { RehearsalSessionFormPage } from './rehearsal-session-form.page';

describe('RehearsalSessionFormPage', () => {
  it('invia i brani aggiornati via PUT premendo Salva modifiche', async () => {
    TestBed.configureTestingModule({
      imports: [RehearsalSessionFormPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), FormBuilder,
        { provide: BandContextService, useValue: { getCurrentBand: () => 7 } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? '1' : '7' } } } },
        { provide: ToastController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(RehearsalSessionFormPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    http.expectOne('/api/v1/rehearsal-rooms').flush([{ id: 5, name: 'Sala' }]);
    http.expectOne('/api/v1/songs?bandId=7').flush([{ id: 2, title: 'A' }, { id: 3, title: 'B' }]);
    http.expectOne('/api/v1/rehearses/1').flush({ id: 1, date: '2026-10-03', status: 'confirmed', rehearsal_room_id: 5, song_ids: [2, 3] });
    http.expectOne('/api/v1/songs?bandId=7').flush([{ id: 2, title: 'A' }, { id: 3, title: 'B' }]);
    fixture.componentInstance.continueToSongs();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('label.song-option').click();
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('app-gigsaw-button')) as HTMLElement[];
    buttons.find((button) => button.textContent?.includes('Salva modifiche'))!.click();
    const request = http.expectOne('/api/v1/rehearses/1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.song_ids).toEqual([3]);
    request.flush({ id: 1, song_ids: [3] });
    http.expectOne('/api/v1/rehearses/1').flush({ id: 1, song_ids: [3], songs: [{ id: 3, title: 'B' }] });
    fixture.componentInstance.toggleSong(3, false);
    fixture.componentInstance.save();
    http.expectOne('/api/v1/rehearses/1').flush({ id: 1 });
    http.expectOne('/api/v1/rehearses/1').flush({ id: 1, song_ids: [3], songs: [{ id: 3, title: 'B' }] });
    expect(fixture.componentInstance.error()).toContain('Il server non ha salvato');
    expect(fixture.componentInstance.step()).toBe(2);
    fixture.componentInstance.save();
    http.expectOne('/api/v1/rehearses/1').flush({ message: 'The selected rehearsal room id is invalid.', errors: { rehearsal_room_id: ['The selected rehearsal room id is invalid.'] } }, { status: 422, statusText: 'Unprocessable Entity' });
    http.expectOne('/api/v1/rehearsal-rooms').flush([{ id: 6, name: 'Nuova sala' }]);
    expect(fixture.componentInstance.step()).toBe(1);
    expect(fixture.componentInstance.form.controls.rehearsalRoomId.value).toBe('');
    expect(fixture.componentInstance.error()).toContain('La sala selezionata');
    expect(fixture.componentInstance.selectedSongIds()).toEqual([]);
    fixture.componentInstance.form.controls.rehearsalRoomId.setValue('6');
    fixture.componentInstance.save();
    const retry = http.expectOne('/api/v1/rehearses/1');
    expect(retry.request.body.rehearsal_room_id).toBe(6);
    expect(retry.request.body.song_ids).toEqual([]);
    retry.flush({ id: 1 });
    http.expectOne('/api/v1/rehearses/1').flush({ id: 1, song_ids: [] });
    http.verify();
  });

  it('aggiorna i brani cliccando la riga e salva la selezione visibile', async () => {
    const sessions = { update: jasmine.createSpy().and.returnValue(of({ id: 1 })), get: () => of({ id: 1, songIds: [3] }) };
    TestBed.configureTestingModule({
      imports: [RehearsalSessionFormPage],
      providers: [provideRouter([]), FormBuilder,
        { provide: RehearsalSessionService, useValue: sessions },
        { provide: RehearsalRoomService, useValue: {} },
        { provide: SongService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? '1' : null } } } },
        { provide: ToastController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(RehearsalSessionFormPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.loading.set(false);
    page.step.set(2);
    page.songs.set([{ id: 2, title: 'A' }, { id: 3, title: 'B' }]);
    page.selectedSongIds.set([2]);
    page.rehearsalRooms.set([{ id: 5, name: 'Sala' }]);
    page.form.patchValue({ date: '2026-10-03', rehearsalRoomId: '5' });
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('label.song-option') as NodeListOf<HTMLLabelElement>;
    rows[0].click();
    rows[1].click();
    fixture.detectChanges();
    expect(page.selectedSongIds()).toEqual([3]);
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBeFalse();
    expect(checkboxes[1].checked).toBeTrue();
    page.save();
    expect(sessions.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ songIds: [3] }));
  });

  it('salva la rimozione e ricarica la selezione quando si riapre la pagina', () => {
    const session = { id: 1, date: '2026-10-03', status: 'confirmed', rehearsalRoomId: 5, songIds: ['2', '3'] };
    const sessions = {
      get: jasmine.createSpy().and.returnValues(of({ ...session, rehearsalRoomId: 999 }), of({ ...session, songIds: [3] }), of({ ...session, songIds: [3] }), of({ ...session, songIds: [] }), of({ ...session, songIds: [] })),
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
    expect(page.form.controls.rehearsalRoomId.value).toBe('');
    expect(page.error()).toContain('non è più disponibile');
    page.save();
    expect(sessions.update).not.toHaveBeenCalled();
    page.form.controls.rehearsalRoomId.setValue('5');
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
