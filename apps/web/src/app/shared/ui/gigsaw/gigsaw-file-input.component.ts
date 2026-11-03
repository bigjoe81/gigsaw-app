import { NativeUiModule } from '../native-ui';
import { Component, input, output, signal } from '@angular/core';
@Component({
  selector: 'app-gigsaw-file-input',
  standalone: true,
  imports: [NativeUiModule],
  template: `
    <div class="ui-item grid min-w-0 gap-2 py-3">
      <span class="ui-label">{{ label() || 'Seleziona file' }}</span>
      <app-gigsaw-button
        tone="outline"
        [buttonClass]="controlClass()"
        [disabled]="disabled()"
        (click)="picker.click()"
        type="button"
      >Sfoglia</app-gigsaw-button>
    </div>
    <input #picker hidden type="file" [accept]="accept()" [multiple]="multiple()" [disabled]="disabled()" (change)="onFilesSelected($event)" />
    @if (fileNames()) { <small class="text-sm">{{ fileNames() }}</small> }
  `,
})
export class GigsawFileInputComponent {
  readonly label = input('');
  readonly accept = input('');
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly controlClass = input('');
  readonly filesChange = output<File[]>();
  readonly fileNames = signal('');

  onFilesSelected(event: Event): void {
    const picker = event.target as HTMLInputElement;
    const files = Array.from(picker.files ?? []);
    picker.value = '';
    this.fileNames.set(files.map(file => file.name).join(', '));
    this.filesChange.emit(files);
  }
}
