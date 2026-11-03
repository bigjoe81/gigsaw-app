import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { GigsawFormControlsModule } from './gigsaw-form-controls.module';

@Component({
  standalone: true,
  imports: [GigsawFormControlsModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <app-gigsaw-input formControlName="title" />
      <app-gigsaw-input type="number" formControlName="count" />
      <app-gigsaw-datepicker formControlName="date" />
      <app-gigsaw-time-input formControlName="time" />
      <app-gigsaw-textarea formControlName="notes" />
      <app-gigsaw-checkbox formControlName="enabled" />
    </form>
  `,
})
class FormControlsFixture {
  readonly form = new FormGroup({
    title: new FormControl(''),
    count: new FormControl<number | null>(null),
    date: new FormControl(''),
    time: new FormControl(''),
    notes: new FormControl(''),
    enabled: new FormControl(false),
  });
}

describe('GigSaw form controls', () => {
  it('synchronizes reactive form values, native input events, and disabled state', () => {
    const fixture = TestBed.createComponent(FormControlsFixture);
    const { form } = fixture.componentInstance;
    form.setValue({
      title: 'Band name',
      count: 12,
      date: '2026-10-22',
      time: '18:30',
      notes: 'Bring the set list',
      enabled: true,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textInput = element.querySelector('input[type="text"]') as HTMLInputElement;
    const numberInput = element.querySelector('input[type="number"]') as HTMLInputElement;
    const dateInput = element.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = element.querySelector('input[type="time"]') as HTMLInputElement;
    const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
    const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(textInput.value).toBe('Band name');
    expect(numberInput.value).toBe('12');
    expect(dateInput.value).toBe('2026-10-22');
    expect(timeInput.value).toBe('18:30');
    expect(textarea.value).toBe('Bring the set list');
    expect(checkbox.checked).toBeTrue();

    numberInput.value = '18';
    numberInput.dispatchEvent(new Event('input'));
    dateInput.value = '2026-11-01';
    dateInput.dispatchEvent(new Event('input'));
    textarea.value = 'Updated notes';
    textarea.dispatchEvent(new Event('input'));
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(form.controls.count.value).toBe(18);
    expect(form.controls.date.value).toBe('2026-11-01');
    expect(form.controls.notes.value).toBe('Updated notes');
    expect(form.controls.enabled.value).toBeFalse();

    form.controls.title.disable();
    fixture.detectChanges();
    expect(textInput.disabled).toBeTrue();
  });

  it('marks a reactive form control as touched when its native field blurs', () => {
    const fixture = TestBed.createComponent(FormControlsFixture);
    fixture.detectChanges();
    const dateInput = fixture.nativeElement.querySelector('input[type="date"]') as HTMLInputElement;

    dateInput.dispatchEvent(new Event('blur'));

    expect(fixture.componentInstance.form.controls.date.touched).toBeTrue();
  });
});
