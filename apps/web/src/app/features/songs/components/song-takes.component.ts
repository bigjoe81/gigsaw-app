import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { DialogService, SymbolComponent } from '../../../shared/ui/native-ui';
import { MAX_UPLOAD_BYTES, SongService, SongTake, uploadErrorMessage } from '../services/song.service';

/**
 * Registrazioni di un brano. Con `rehearseId` mostra solo quelle della prova e permette di caricarne;
 * senza, mostra la storia completa del brano (dalla più recente).
 */
@Component({
  selector: 'app-song-takes',
  standalone: true,
  imports: [SymbolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rehearseId) {
      <div class="flex flex-wrap items-center gap-2">
        <input #fileInput hidden type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" (change)="upload($event)" />
        <button type="button" class="btn btn-outline btn-xs" [disabled]="uploading()" (click)="fileInput.click()">
          @if (uploading()) { <span class="loading loading-spinner loading-xs"></span> Caricamento… }
          @else { <app-symbol name="cloud-upload-outline" /> Carica registrazione }
        </button>
      </div>
    }
    @if (error()) { <p class="m-0 mt-2 text-xs text-error">{{ error() }}</p> }
    @if (!loading() && !takes().length && !rehearseId) {
      <p class="m-0 text-sm text-[var(--gigsaw-muted)]">Ancora nessuna registrazione. Caricale dalle prove per ricostruire la storia del brano.</p>
    }
    <ul class="m-0 mt-2 flex list-none flex-col gap-2 p-0">
      @for (take of takes(); track take.id) {
        <li class="rounded-xl border border-[var(--gigsaw-border)] bg-[var(--gigsaw-input-background)] p-3">
          <div class="flex items-center gap-3">
            <button type="button" class="btn btn-circle btn-primary btn-sm" [attr.aria-label]="'Ascolta ' + take.name" (click)="play(take)">
              @if (loadingTake() === take.id) { <span class="loading loading-spinner loading-xs"></span> }
              @else { <app-symbol name="play" /> }
            </button>
            <div class="min-w-0 flex-1">
              <p class="m-0 truncate text-sm font-semibold">{{ rehearseId ? take.name : heading(take) }}</p>
              <p class="m-0 truncate text-xs text-[var(--gigsaw-muted)]">{{ rehearseId ? sizeLabel(take) : take.name + ' · ' + sizeLabel(take) }}</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm btn-square text-error" [disabled]="deletingTake() === take.id" [attr.aria-label]="'Elimina ' + take.name" (click)="confirmDelete(take)">
              @if (deletingTake() === take.id) { <span class="loading loading-spinner loading-xs"></span> }
              @else { <app-symbol name="trash-outline" /> }
            </button>
          </div>
          @if (urls()[take.id]; as url) {
            <audio class="mt-3 w-full" controls autoplay [src]="url"></audio>
          }
        </li>
      }
    </ul>
  `,
})
export class SongTakesComponent implements OnInit, OnDestroy {
  @Input({ required: true }) songId!: number;
  @Input() rehearseId?: number;

  private readonly songs = inject(SongService);
  private readonly dialogs = inject(DialogService);
  readonly deletingTake = signal<number | null>(null);
  readonly takes = signal<SongTake[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly loadingTake = signal<number | null>(null);
  readonly error = signal('');
  readonly urls = signal<Record<number, string>>({});

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    Object.values(this.urls()).forEach((url) => URL.revokeObjectURL(url));
  }

  heading(take: SongTake): string {
    const title = take.rehearseTitle || 'Prova';
    if (!take.rehearseDate) return title;
    const date = new Date(`${take.rehearseDate.slice(0, 10)}T12:00:00`);
    const label = Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    return label ? `${label} · ${title}` : title;
  }

  sizeLabel(take: SongTake): string {
    return `${(take.size / 1024 / 1024).toFixed(1)} MB`;
  }

  play(take: SongTake): void {
    if (this.urls()[take.id] || this.loadingTake() !== null) return;
    this.error.set('');
    this.loadingTake.set(take.id);
    this.songs.takeAudio(take.downloadUrl).pipe(finalize(() => this.loadingTake.set(null))).subscribe({
      next: (blob) => this.urls.update((urls) => ({ ...urls, [take.id]: URL.createObjectURL(blob) })),
      error: () => this.error.set('Impossibile riprodurre la registrazione.'),
    });
  }

  async confirmDelete(take: SongTake): Promise<void> {
    const dialog = await this.dialogs.create({
      header: 'Eliminare la registrazione?',
      message: `"${take.name}" verrà eliminata dalla storia del brano. L'operazione non può essere annullata.`,
      buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: () => this.delete(take) }],
    });
    await dialog.present();
  }

  private delete(take: SongTake): void {
    this.error.set('');
    this.deletingTake.set(take.id);
    this.songs.deleteTake(this.songId, take.id).pipe(finalize(() => this.deletingTake.set(null))).subscribe({
      next: () => {
        const url = this.urls()[take.id];
        if (url) URL.revokeObjectURL(url);
        this.urls.update(({ [take.id]: _removed, ...rest }) => rest);
        this.takes.update((takes) => takes.filter((item) => item.id !== take.id));
      },
      error: (error: { status?: number }) => this.error.set(error.status === 403
        ? 'Puoi eliminare solo le registrazioni caricate da te (o essere admin della band).'
        : 'Impossibile eliminare la registrazione.'),
    });
  }

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.rehearseId) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      this.error.set(`Il file è troppo grande (${(file.size / 1048576).toFixed(1)} MB). Il limite è 50 MB.`);
      return;
    }
    this.error.set('');
    this.uploading.set(true);
    this.songs.uploadTake(this.songId, this.rehearseId, file).pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: () => this.load(),
      error: (error) => this.error.set(uploadErrorMessage(error)),
    });
  }

  private load(): void {
    this.songs.history(this.songId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (takes) => this.takes.set(this.rehearseId ? takes.filter((take) => take.rehearseId === this.rehearseId) : takes),
      error: () => this.error.set('Impossibile caricare le registrazioni.'),
    });
  }
}
