import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-daisy-file-input',
  standalone: true,
  template: `
    <label class="grid gap-2">
      @if (label()) { <span class="text-sm font-semibold text-[var(--gigsaw-text)]">{{ label() }}</span> }
      <input
        class="file-input {{ controlClass() }}"
        type="file"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="disabled()"
        (change)="onFilesSelected($event)"
      />
      @if (fileNames()) { <span class="text-xs text-[var(--gigsaw-muted)]">{{ fileNames() }}</span> }
    </label>
  `,
})
export class DaisyFileInputComponent {
  readonly label = input('');
  readonly accept = input('');
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly controlClass = input('');
  readonly filesChange = output<File[]>();
  readonly fileNames = signal('');

  onFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.fileNames.set(files.map((file) => file.name).join(', '));
    this.filesChange.emit(files);
  }
}
