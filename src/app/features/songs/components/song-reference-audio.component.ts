import { ChangeDetectionStrategy, Component, Input, OnDestroy, signal } from '@angular/core';
import { SymbolComponent } from '../../../shared/ui/native-ui';
import { SongService } from '../services/song.service';

@Component({
  selector: 'app-song-reference-audio',
  standalone: true,
  imports: [SymbolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (url(); as src) {
      <audio class="w-full" controls autoplay [src]="src"></audio>
    } @else {
      <button type="button" class="btn btn-outline btn-sm" [disabled]="loading()" (click)="play()">
        @if (loading()) { <span class="loading loading-spinner loading-xs"></span> }
        @else { <app-symbol name="play" /> }
        Ascolta l'mp3 di riferimento
      </button>
    }
    @if (error()) { <p class="m-0 mt-2 text-xs text-error">{{ error() }}</p> }
  `,
})
export class SongReferenceAudioComponent implements OnDestroy {
  @Input({ required: true }) downloadUrl = '';

  readonly url = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(private readonly songs: SongService) {}

  ngOnDestroy(): void {
    if (this.url()) URL.revokeObjectURL(this.url());
  }

  play(): void {
    this.loading.set(true);
    this.error.set('');
    this.songs.takeAudio(this.downloadUrl).subscribe({
      next: (blob) => { this.url.set(URL.createObjectURL(blob)); this.loading.set(false); },
      error: () => { this.error.set('Impossibile riprodurre il file.'); this.loading.set(false); },
    });
  }
}
