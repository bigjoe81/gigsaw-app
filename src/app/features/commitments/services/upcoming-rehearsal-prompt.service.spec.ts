import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { BandResourceApiService } from '../../../core/services/band-resource-api.service';
import { OverlayService, ToastService } from '../../../shared/ui/native-ui';
import { BandService } from '../../bands/api';
import { UpcomingEventsOnboardingModalComponent } from '../components/upcoming-events-onboarding-modal.component';
import { UpcomingRehearsalPromptService } from './upcoming-rehearsal-prompt.service';

describe('UpcomingRehearsalPromptService', () => {
  let bands: { listUserBands: jasmine.Spy };
  let resources: { list: jasmine.Spy };
  let overlays: { create: jasmine.Spy };
  let service: UpcomingRehearsalPromptService;

  beforeEach(() => {
    bands = {
      listUserBands: jasmine.createSpy().and.returnValue(
        of([
          { id: 4, name: 'I Cigni' },
          { id: 7, name: 'Le Onde' },
        ]),
      ),
    };
    resources = { list: jasmine.createSpy() };
    overlays = { create: jasmine.createSpy().and.resolveTo({ present: jasmine.createSpy().and.resolveTo(undefined) }) };

    TestBed.configureTestingModule({
      providers: [
        UpcomingRehearsalPromptService,
        provideRouter([]),
        { provide: BandService, useValue: bands },
        { provide: BandResourceApiService, useValue: resources },
        { provide: OverlayService, useValue: overlays },
        { provide: ToastService, useValue: { create: jasmine.createSpy() } },
      ],
    });
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
      return of(
        bandId === 4
          ? [{ id: 9, title: 'Prova annullata', date: rehearsalDate, status: 'cancelled' }]
          : [{ id: 12, title: 'Prova acustica', date: rehearsalDate, status: 'confirmed', startTime: '19:30' }],
      );
    });

    service.openUpcomingEvents();
    await Promise.resolve();

    expect(resources.list).toHaveBeenCalledWith(4, 'rehearsal-sessions');
    expect(resources.list).toHaveBeenCalledWith(4, 'gigs');
    expect(resources.list).toHaveBeenCalledWith(7, 'rehearsal-sessions');
    expect(resources.list).toHaveBeenCalledWith(7, 'gigs');
    expect(overlays.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        component: UpcomingEventsOnboardingModalComponent,
        componentProps: jasmine.objectContaining({
          bands: jasmine.arrayContaining([
            jasmine.objectContaining({ id: 4, name: 'I Cigni' }),
            jasmine.objectContaining({ id: 7, name: 'Le Onde' }),
          ]),
          events: jasmine.arrayContaining([jasmine.objectContaining({ bandId: 7, type: 'rehearsal', eventId: 12 })]),
        }),
        boxCssClass: jasmine.stringContaining('max-w-5xl'),
      }),
    );
  });

  it('opens the upcoming-events modal for the selected band even if there are no future events', async () => {
    resources.list.and.returnValue(of([]));

    service.openUpcomingEvents(4);
    await Promise.resolve();

    expect(resources.list).toHaveBeenCalledWith(4, 'rehearsal-sessions');
    expect(resources.list).toHaveBeenCalledWith(4, 'gigs');
    expect(resources.list).not.toHaveBeenCalledWith(7, 'rehearsal-sessions');
    expect(overlays.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        component: UpcomingEventsOnboardingModalComponent,
        componentProps: jasmine.objectContaining({
          bands: jasmine.arrayContaining([jasmine.objectContaining({ id: 4, name: 'I Cigni' })]),
          events: [],
        }),
      }),
    );
  });
  it('keeps today events without a time, but excludes past days and elapsed timed events', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 9, 25, 16, 0));
      resources.list.and.callFake((_bandId: number, resource: string) =>
        of(
          resource === 'gigs'
            ? []
            : [
                { id: 1, date: '2026-10-24' },
                { id: 2, date: '2026-10-25', startTime: '15:00' },
                { id: 3, date: '2026-10-25' },
                { id: 4, date: '2026-10-25', startTime: '18:00' },
              ],
        ),
      );
      service.nextEvent(4).subscribe((event) => expect(event?.eventId).toBe(3));

      resources.list.and.callFake((_bandId: number, resource: string) =>
        of(resource === 'gigs' ? [{ id: 5, date: '2026-10-25' }] : []),
      );
      service.nextEvent(4).subscribe((event) => expect(event?.eventId).toBe(5));
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
