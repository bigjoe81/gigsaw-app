import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormPageHeaderComponent } from './form-page-header.component';

@Component({
  standalone: true,
  imports: [FormPageHeaderComponent],
  template: `
    <app-form-page-header
      title="Nuova prova"
      [sections]="sections"
      [activeSection]="activeSection"
      ariaLabel="Avanzamento creazione prova"
      (sectionChange)="activeSection = $event"
    />
  `,
})
class FormPageHeaderFixture {
  sections = [{ id: 1, label: 'Dettagli' }, { id: 2, label: 'Brani da provare' }];
  activeSection = 1;
}

describe('FormPageHeaderComponent', () => {
  it('renders DaisyUI steps and keeps step navigation interactive', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FormPageHeaderFixture);
    fixture.detectChanges();

    const stepList = fixture.nativeElement.querySelector('app-gigsaw-steps ul') as HTMLElement;
    const steps = stepList.querySelectorAll<HTMLElement>('li.step');
    expect(stepList.getAttribute('aria-label')).toBe('Avanzamento creazione prova');
    expect(stepList.classList.contains('steps-horizontal')).toBeTrue();
    expect(steps.length).toBe(2);
    expect(steps[0].classList.contains('step-primary')).toBeTrue();
    expect(steps[1].classList.contains('step-primary')).toBeFalse();
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(steps[0].textContent?.trim()).toBe('Dettagli');
    expect(steps[1].textContent?.trim()).toBe('Brani da provare');

    steps[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeSection).toBe(2);
    expect(steps[1].classList.contains('step-primary')).toBeTrue();
  });
});
