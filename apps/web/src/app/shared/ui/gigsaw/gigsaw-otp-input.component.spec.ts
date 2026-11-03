import { TestBed } from '@angular/core/testing';
import { GigsawOtpInputComponent } from './gigsaw-otp-input.component';

describe('GigsawOtpInputComponent', () => {
  it('uses DaisyUI OTP slots and emits only numeric codes', () => {
    const fixture = TestBed.createComponent(GigsawOtpInputComponent);
    fixture.detectChanges();
    let emittedValue = '';
    let completedCode = '';
    fixture.componentInstance.valueChange.subscribe(value => emittedValue = value);
    fixture.componentInstance.complete.subscribe(value => completedCode = value);

    const otp = fixture.nativeElement.querySelector('.otp') as HTMLElement;
    const input = otp.querySelector('input') as HTMLInputElement;
    expect(otp.querySelectorAll(':scope > span').length).toBe(6);
    expect(input.maxLength).toBe(6);
    expect(input.autocomplete).toBe('one-time-code');
    expect(input.getAttribute('pattern')).toBe('[0-9]{6}');
    expect(getComputedStyle(otp.querySelector('span') as HTMLElement).backgroundColor).toBe('rgb(21, 27, 35)');
    expect(getComputedStyle(otp).getPropertyValue('--input-color').trim()).toBe('#596474');

    fixture.componentRef.setInput('value', '123456');
    fixture.detectChanges();
    expect(input.value).toBe('123456');
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(input.value).toBe('');

    input.value = '12a 3456';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(emittedValue).toBe('123456');
    expect(completedCode).toBe('123456');
    expect(otp.classList.contains('otp-success')).toBeFalse();

    fixture.componentRef.setInput('valid', true);
    fixture.detectChanges();
    expect(otp.classList.contains('otp-success')).toBeTrue();

    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();
    expect(otp.classList.contains('otp-error')).toBeTrue();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
