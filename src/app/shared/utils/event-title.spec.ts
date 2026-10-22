import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { GigFormPage } from '../../features/gigs/pages/gig-form.page';
import { GigService } from '../../features/gigs/services/gig.service';
import { RehearsalSessionFormPage } from '../../features/rehearsal-sessions/pages/rehearsal-session-form.page';
import { RehearsalSessionService } from '../../features/rehearsal-sessions/services/rehearsal-session.service';
import { RehearsalRoomService } from '../../features/rehearsal-sessions/services/rehearsal-room.service';
import { SongService } from '../../features/songs/services/song.service';
import { VenueService } from '../../features/venues/services/venue.service';
import { MapboxGeocodingService } from '../../features/venues/services/mapbox-geocoding.service';
import { eventTitleDate } from './event-title';

const route = (id: string | null = null) => ({ snapshot: { paramMap: { get: (key: string) => key === 'id' ? id : null } } }) as unknown as ActivatedRoute;
const toast = { create: () => Promise.resolve({ present: () => Promise.resolve() }) } as unknown as ToastController;
const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;

describe('Event titles', () => {
  it('formats a calendar date without timezone shifts and rejects invalid dates', () => {
    expect(eventTitleDate('2026-11-05')).toBe('5 novembre 2026');
    expect(eventTitleDate('2026-02-30')).toBe('');
    expect(eventTitleDate('')).toBe('');
  });

  it('updates concert titles from either venue source and preserves custom titles', () => {
    const gigs = { create: jasmine.createSpy().and.returnValue(of({ id: 1 })) };
    const page = new GigFormPage(new FormBuilder(), gigs as unknown as GigService,
      { list: () => of([]) } as unknown as VenueService,
      { isConfigured: () => false } as unknown as MapboxGeocodingService, route(), router, toast);
    page.ngOnInit();
    page.form.controls.date.setValue('2026-10-31');
    page.selectExistingVenue({ id: 3, name: 'Nama Brewing' });
    expect(page.form.controls.title.value).toBe('Nama Brewing · 31 ottobre 2026');
    page.form.controls.date.setValue('2026-11-05');
    expect(page.form.controls.title.value).toBe('Nama Brewing · 5 novembre 2026');
    page.clearVenueSelection();
    expect(page.form.controls.title.value).toBe('');
    page.selectMapboxResult({ id: 'new', name: 'Bloom', fullAddress: 'Mezzago', city: 'Mezzago', address: 'Via Curiel', latitude: 0, longitude: 0 });
    expect(page.form.controls.title.value).toBe('Bloom · 5 novembre 2026');
    page.form.controls.title.setValue('Halloween live');
    page.form.controls.date.setValue('2026-11-06');
    page.selectExistingVenue({ id: 3, name: 'Nama Brewing' });
    expect(page.form.controls.title.value).toBe('Halloween live');
    page.form.controls.title.setValue('');
    expect(page.form.controls.title.value).toBe('Nama Brewing · 6 novembre 2026');
    page.save();
    expect(gigs.create).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Nama Brewing · 6 novembre 2026' }));
    page.ngOnDestroy();
  });

  it('leaves a saved concert title unchanged while editing its date and venue', () => {
    const page = new GigFormPage(new FormBuilder(), { get: () => of({ id: 1, title: 'Live speciale', date: '2026-10-31', venueId: 3 }) } as unknown as GigService,
      { list: () => of([{ id: 3, name: 'Nama Brewing' }]) } as unknown as VenueService,
      { isConfigured: () => false } as unknown as MapboxGeocodingService, route('1'), router, toast);
    page.ngOnInit();
    page.form.controls.date.setValue('2026-11-05');
    page.selectExistingVenue({ id: 4, name: 'Bloom' });
    expect(page.form.controls.title.value).toBe('Live speciale');
    page.ngOnDestroy();
  });

  it('populates rehearsal titles, follows the date and respects manual and saved titles', () => {
    const makePage = (id: string | null = null) => new RehearsalSessionFormPage(new FormBuilder(),
      { get: () => of({ id: 1, title: 'Prova generale', date: '2026-10-31', rehearsalRoomId: 5 }) } as unknown as RehearsalSessionService,
      { list: () => of([{ id: 5, name: 'Sala' }]) } as unknown as RehearsalRoomService,
      { list: () => of([]) } as unknown as SongService, route(id), router, toast);
    const page = makePage();
    page.ngOnInit();
    expect(page.form.controls.title.value).toMatch(/^Prove del /);
    page.form.controls.date.setValue('2026-11-05');
    expect(page.form.controls.title.value).toBe('Prove del 5 novembre 2026');
    page.form.controls.title.setValue('Prova Halloween');
    page.form.controls.date.setValue('2026-11-06');
    expect(page.form.controls.title.value).toBe('Prova Halloween');
    page.form.controls.title.setValue('');
    expect(page.form.controls.title.value).toBe('Prove del 6 novembre 2026');
    page.ngOnDestroy();
    const editing = makePage('1');
    editing.ngOnInit();
    editing.ionViewWillEnter();
    editing.form.controls.date.setValue('2026-11-05');
    expect(editing.form.controls.title.value).toBe('Prova generale');
    editing.ngOnDestroy();
  });
});
