import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NativeUiModule, DialogService } from './native-ui';

@Component({ changeDetection: ChangeDetectionStrategy.Default, imports: [NativeUiModule], template: `<select appSelect [multiple]="true" [appSelectValue]="selected()" (selectionChange)="selected.set($event)">@for(option of options(); track option){<option [value]="option">{{option}}</option>}</select>` })
class MultiSelectFixture { options = signal(['a', 'b']); selected = signal(['b']); }
@Component({ changeDetection: ChangeDetectionStrategy.Default, imports: [NativeUiModule], template: `<app-dialog [isOpen]="open()" (closed)="open.set(false)"><ng-template><button type="button">Contenuto</button></ng-template></app-dialog>` })
class ModalFixture { open = signal(false); }

describe('DaisyUI native controls', () => {
  afterEach(() => document.querySelectorAll('body > dialog').forEach(dialog => dialog.remove()));
  it('retains multiple values and synchronizes options loaded later', async () => {
    const fixture = TestBed.createComponent(MultiSelectFixture);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.selectedOptions, option => option.value)).toEqual(['b']);
    select.options[0].selected = true;
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.selected()).toEqual(['a', 'b']);
    fixture.componentInstance.options.set(['a', 'b', 'c']);
    fixture.componentInstance.selected.set(['c']); fixture.detectChanges();
    await Promise.resolve();
    expect(Array.from(select.selectedOptions, option => option.value)).toEqual(['c']);
  });
  it('opens, cancels and reopens an inline modal', () => {
    const fixture = TestBed.createComponent(ModalFixture); fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    fixture.componentInstance.open.set(true); fixture.detectChanges(); expect(dialog.open).toBeTrue();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true })); fixture.detectChanges();
    expect(dialog.open).toBeFalse(); expect(fixture.componentInstance.open()).toBeFalse();
    fixture.componentInstance.open.set(true); fixture.detectChanges(); expect(dialog.open).toBeTrue();
    fixture.destroy(); expect(dialog.open).toBeFalse();
  });
  it('does not execute a destructive action when a confirmation is cancelled', async () => {
    const action = jasmine.createSpy();
    const dialog = await TestBed.inject(DialogService).create({ header: 'Elimina?', buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: action }] });
    await dialog.present();
    (document.querySelector('body > dialog button') as HTMLButtonElement).click();
    await Promise.resolve(); expect(action).not.toHaveBeenCalled(); expect(document.querySelector('body > dialog')).toBeNull();
  });
  it('keeps a prompted dialog open when its handler rejects the input', async () => {
    const action = jasmine.createSpy().and.returnValue(false);
    const dialog = await TestBed.inject(DialogService).create({ inputs: [{ name: 'code', value: 'ABC' }], buttons: [{ text: 'Entra', handler: action }] });
    await dialog.present(); (document.querySelector('body > dialog button') as HTMLButtonElement).click();
    await Promise.resolve(); expect(action).toHaveBeenCalledWith({ code: 'ABC' });
    expect(document.querySelector('body > dialog[open]')).not.toBeNull();
  });
});
