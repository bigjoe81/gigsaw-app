import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { UpcomingRehearsalPromptService } from './features/auth/upcoming-rehearsal-prompt.service';

@Component({ standalone: true, template: '' })
class StartupRouteComponent {}

describe('AppComponent', () => {
  it('checks for upcoming rehearsals as soon as an authenticated session is restored', async () => {
    const checkForUpcomingRehearsals = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: StartupRouteComponent }]),
        { provide: AuthService, useValue: { restoreSession: () => of({ id: 1, name: 'Test', email: 'test@example.com' }) } },
        { provide: UpcomingRehearsalPromptService, useValue: { checkForUpcomingRehearsals } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(checkForUpcomingRehearsals).toHaveBeenCalledTimes(1);
  });

  it('does not check rehearsals when no authenticated session is restored', async () => {
    const checkForUpcomingRehearsals = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: StartupRouteComponent }]),
        { provide: AuthService, useValue: { restoreSession: () => of(null) } },
        { provide: UpcomingRehearsalPromptService, useValue: { checkForUpcomingRehearsals } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(checkForUpcomingRehearsals).not.toHaveBeenCalled();
  });
});
