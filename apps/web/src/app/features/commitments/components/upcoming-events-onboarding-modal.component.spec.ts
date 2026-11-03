import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BandContextService } from '../../../core/services/band-context.service';
import { OverlayService } from '../../../shared/ui/native-ui';
import { UpcomingEventsOnboardingModalComponent } from './upcoming-events-onboarding-modal.component';

describe('UpcomingEventsOnboardingModalComponent', () => {
  it('uses selectable band cards and updates the selected band event', async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingEventsOnboardingModalComponent],
      providers: [
        { provide: OverlayService, useValue: { dismiss: jasmine.createSpy() } },
        { provide: BandContextService, useValue: { setCurrentBand: jasmine.createSpy() } },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UpcomingEventsOnboardingModalComponent);
    fixture.componentInstance.bands = [
      { id: 4, name: 'I Cigni' },
      { id: 7, name: 'Crossroads Blues Trio' },
    ];
    fixture.componentInstance.events = [
      {
        id: 'rehearsal:4:1',
        bandId: 4,
        type: 'rehearsal',
        eventId: 1,
        title: 'Prova',
        date: '2026-11-05',
        timestamp: new Date(2026, 10, 5).getTime(),
      },
      {
        id: 'gig:7:2',
        bandId: 7,
        type: 'gig',
        eventId: 2,
        title: 'Live',
        date: '2026-11-08',
        timestamp: new Date(2026, 10, 8).getTime(),
      },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    const bandCards = Array.from(fixture.nativeElement.querySelectorAll('button[aria-pressed]')) as HTMLButtonElement[];
    const bandCard = bandCards.find((button) =>
      button.textContent.includes('Crossroads Blues Trio'),
    ) as HTMLButtonElement;
    expect(bandCard).toBeTruthy();
    bandCard.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedBand()?.name).toBe('Crossroads Blues Trio');
    expect(fixture.componentInstance.selectedEvent()?.type).toBe('gig');
    expect(fixture.nativeElement.textContent).toContain('Prepariamo il concerto');
  });
});
