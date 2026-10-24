import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BandResourceApiService } from '../../core/services/band-resource-api.service';
import { OverlayService, ToastService } from '../../shared/ui/native-ui';
import { BandService } from '../bands/services/band.service';
import { UpcomingEventsOnboardingModalComponent } from './upcoming-events-onboarding-modal.component';
import { UpcomingRehearsalPromptService } from './upcoming-rehearsal-prompt.service';

describe('UpcomingRehearsalPromptService', () => {
  let bands: { listUserBands: jasmine.Spy };
  let resources: { list: jasmine.Spy };
  let overlays: { create: jasmine.Spy };
  let service: UpcomingRehearsalPromptService;

  beforeEach(() => {
    bands = { listUserBands: jasmine.createSpy().and.returnValue(of([
      { id: 4, name: 'I Cigni' },
      { id: 7, name: 'Le Onde' },
    ])) };
    resources = { list: jasmine.createSpy() };
    overlays = { create: jasmine.createSpy().and.resolveTo({ present: jasmine.createSpy().and.resolveTo(undefined) }) };

    TestBed.configureTestingModule({ providers: [
      UpcomingRehearsalPromptService,
      { provide: BandService, useValue: bands },
      { provide: BandResourceApiService, useValue: resources },
      { provide: OverlayService, useValue: overlays },
      { provide: ToastService, useValue: { create: jasmine.createSpy() } },
    ] });
    service = TestBed.inject(UpcomingRehearsalPromptService);
  });

  it('prompts for the nearest future rehearsal across bands, even more than seven days away', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 12);
    const rehearsalDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-');
    resources.list.and.callFake((bandId: number, resource: string) => {
      if (resource === 'gigs') return of([]);
      return of(bandId === 4
        ? [{ id: 9, title: 'Prova annullata', date: rehearsalDate, status: 'cancelled' }]
        : [{ id: 12, title: 'Prova acustica', date: rehearsalDate, status: 'confirmed', startTime: '19:30' }]);
    });

    service.checkForUpcomingRehearsals();
    await Promise.resolve();

    expect(resources.list).toHaveBeenCalledWith(4, 'rehearsal-sessions');
    expect(resources.list).toHaveBeenCalledWith(4, 'gigs');
    expect(resources.list).toHaveBeenCalledWith(7, 'rehearsal-sessions');
    expect(resources.list).toHaveBeenCalledWith(7, 'gigs');
    expect(overlays.create).toHaveBeenCalledWith(jasmine.objectContaining({
      component: UpcomingEventsOnboardingModalComponent,
      componentProps: jasmine.objectContaining({
        bands: jasmine.arrayContaining([
          jasmine.objectContaining({ id: 4, name: 'I Cigni' }),
          jasmine.objectContaining({ id: 7, name: 'Le Onde' }),
        ]),
        events: jasmine.arrayContaining([
          jasmine.objectContaining({ bandId: 7, type: 'rehearsal', eventId: 12 }),
        ]),
      }),
      boxCssClass: jasmine.stringContaining('max-w-5xl'),
    }));
  });

  it('does not prompt when there are no future rehearsals', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    resources.list.and.callFake((_bandId: number, resource: string) => of(resource === 'gigs' ? [] : [
      { id: 1, title: 'Prova passata', date: yesterday.toISOString().slice(0, 10), status: 'confirmed' },
      { id: 2, title: 'Prova annullata', date: '2099-10-01', status: 'cancelled' },
    ]));

    service.checkForUpcomingRehearsals();

    expect(overlays.create).not.toHaveBeenCalled();
  });
});
