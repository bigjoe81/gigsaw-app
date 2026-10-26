import { ChangelogService } from './core/services/changelog.service';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { UpcomingRehearsalPromptService } from './features/commitments/api';

@Component({ standalone: true, template: '' })
class StartupRouteComponent {}

describe('AppComponent', () => {
  it('does not automatically open upcoming events on startup', async () => {
    const openUpcomingEvents = jasmine.createSpy();
    const restoreSession = jasmine.createSpy().and.returnValue(of({ id: 1, name: 'Test', email: 'test@example.com' }));
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: ChangelogService, useValue: { changelog$: of({ current: "", releases: [] }) } }, provideRouter([{ path: '', component: StartupRouteComponent }]),
        { provide: AuthService, useValue: { restoreSession } },
        { provide: UpcomingRehearsalPromptService, useValue: { openUpcomingEvents } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(restoreSession).toHaveBeenCalledTimes(1);
    expect(openUpcomingEvents).not.toHaveBeenCalled();
  });

  it('does not open upcoming events when no authenticated session is restored', async () => {
    const openUpcomingEvents = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: ChangelogService, useValue: { changelog$: of({ current: "", releases: [] }) } }, provideRouter([{ path: '', component: StartupRouteComponent }]),
        { provide: AuthService, useValue: { restoreSession: () => of(null) } },
        { provide: UpcomingRehearsalPromptService, useValue: { openUpcomingEvents } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(openUpcomingEvents).not.toHaveBeenCalled();
  });
});
