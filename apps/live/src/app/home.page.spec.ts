import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';
import { SessionService } from './session.service';
import { signal } from '@angular/core';
import { DEMO } from './demo';
describe('Live home', () => {
  it('keeps rehearsal and stage as the primary choices with explicit demo state', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: {
            session: signal(DEMO),
            cached: signal(false),
            ready: signal(true),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.mode-card'),
    ) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/rehearsal',
      '/stage',
    ]);
    expect(fixture.nativeElement.textContent).toContain('sessione demo');
  });
});
