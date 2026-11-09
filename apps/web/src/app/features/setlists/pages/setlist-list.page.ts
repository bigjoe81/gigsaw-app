import { WorkspaceTopbarComponent } from '../../../shared/ui/workspace-topbar.component';
import { workspaceRows } from '../../../shared/ui/workspace-table';
import { GigService } from '../../gigs/api';
import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { ToastService } from '../../../shared/ui/native-ui';
import { SetlistPdfModalComponent } from '../components/setlist-pdf-modal.component';
import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, Subscription, timeout } from 'rxjs';
import { Gig, Setlist } from '../../../core/models/band-resources.models';
import { SetlistPdfOptions } from '../models/setlist.models';
import { SetlistPdfService, SetlistPdfFormat } from '../services/setlist-pdf.service';
import { SetlistService } from '../services/setlist.service';

type PdfAction = `download-${number}` | `share-${number}` | null;

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, WorkspaceTopbarComponent,
    SetlistPdfModalComponent,
    RouterLink, ],
  templateUrl: './setlist-list.page.html',
  styleUrl: './setlist-list.page.scss',
})
export class SetlistListPage implements OnDestroy {
  readonly pdfOptions = signal<SetlistPdfOptions>({ includePerformedBy: true, includeKey: true, includeBpm: true });
  readonly pdfRequest = signal<{ setlist: Setlist; action: 'download' | 'share' } | null>(null);

  requestPdf(setlist: Setlist, action: 'download' | 'share', event: Event): void {
    this.stopCardNavigation(event);
    this.pdfRequest.set({ setlist, action });
  }

  confirmPdf(): void {
    const request = this.pdfRequest();
    if (!request) return;
    this.pdfRequest.set(null);
    if (request.action === 'download') void this.downloadPdf(request.setlist);
    else void this.sharePdf(request.setlist);
  }

  readonly pdfFormat = signal<SetlistPdfFormat>('a4');
  readonly setlists = signal<Setlist[]>([]);
  readonly gigs = signal<Gig[]>([]);
  readonly search = signal('');
  readonly filter = signal<'upcoming' | 'past' | 'all'>('all');
  readonly visible = computed(() => this.setlists().filter(list => {
    const date = this.concertDate(list);
    return this.filter() === 'all' || (!!date && (this.filter() === 'upcoming') === (date.slice(0, 10) >= this.today()));
  }));
  readonly rows = workspaceRows(this.visible, this.search,
    list => [list.title, this.concertTitle(list), this.venue(list)].join(' '),
    list => this.concertDate(list) ?? '', computed(() => this.filter() !== 'upcoming'));

  private today(): string {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  concert(list: Setlist): Gig | undefined { return this.gigs().find(gig => gig.id === list.gigId); }
  concertDate(list: Setlist): string | null { return this.concert(list)?.date ?? list.date ?? null; }
  concertTitle(list: Setlist): string { return this.concert(list)?.title || list.gigTitle || (list.gigId ? 'Concerto associato' : 'Da associare'); }
  venue(list: Setlist): string { return this.concert(list)?.venue?.name || list.venueName || ''; }
  duration(list: Setlist): string {
    const seconds = list.items?.length
      ? list.items.reduce((sum, section) => sum + section.items.reduce((total, item) => total + item.durationSeconds, 0), 0)
      : (list.songs ?? list.songEntries ?? []).reduce((sum, song) => sum + (song.duration ?? 0), 0);
    return seconds ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : '—';
  }
  readonly loading = signal(true);
  readonly error = signal('');
  readonly pdfAction = signal<PdfAction>(null);

  constructor(
    private readonly setlistsApi: SetlistService,
    private readonly gigsApi: GigService,
    private readonly setlistPdf: SetlistPdfService,
    private readonly toast: ToastService,
  ) {

  }

  private listRequest?: Subscription;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.listRequest?.unsubscribe(); }

  load(event?: CustomEvent): void {
    this.listRequest?.unsubscribe();
    if (!event) this.loading.set(true);
    this.error.set('');
    this.listRequest = forkJoin({ setlists: this.setlistsApi.list(), gigs: this.gigsApi.list().pipe(timeout(10000), catchError(() => of([]))) }).pipe(
      timeout(15000),
      finalize(() => {
        this.loading.set(false);
        void event?.detail?.complete?.();
      }),
    ).subscribe({
      next: ({ setlists, gigs }) => { this.setlists.set(setlists); this.gigs.set(gigs); },
      error: (error: Error) => this.error.set(error.name === 'TimeoutError'
        ? 'Il server sta impiegando troppo tempo. Riprova tra qualche secondo.'
        : error.message || 'Impossibile caricare le scalette.'),
    });
  }

  songCount(setlist: Setlist): number {
    return setlist.songs?.length ?? setlist.songIds?.length ?? 0;
  }

  setCount(setlist: Setlist): number {
    return setlist.sections?.length || (setlist.sets?.length ?? setlist.generation?.setCount ?? 0);
  }

  date(setlist: Setlist): string {
    const date = this.concertDate(setlist);
    if (!date) return 'Data da definire';
    const value = new Date(`${date.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(value.getTime())) return date;
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(value);
  }

  async downloadPdf(setlist: Setlist, event?: Event): Promise<void> {
    if (event) this.stopCardNavigation(event);
    this.pdfAction.set(`download-${setlist.id}`);
    try {
      const uri = await this.setlistPdf.download(setlist.id, setlist.title, this.pdfFormat(), this.pdfOptions());
      if (uri) await this.showToast('PDF salvato sul dispositivo.', 'success');
    } catch (error) {
      this.pdfAction.set(null);
      await this.showToast(this.errorMessage(error, 'Impossibile scaricare il PDF.'), 'danger');
    } finally {
      this.pdfAction.set(null);
    }
  }

  async sharePdf(setlist: Setlist, event?: Event): Promise<void> {
    if (event) this.stopCardNavigation(event);
    this.pdfAction.set(`share-${setlist.id}`);
    try {
      await this.setlistPdf.share(setlist.id, setlist.title, this.pdfFormat(), this.pdfOptions());
    } catch (error) {
      this.pdfAction.set(null);
      await this.showToast(this.errorMessage(error, 'Impossibile condividere il PDF.'), 'danger');
    } finally {
      this.pdfAction.set(null);
    }
  }

  private stopCardNavigation(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    await (await this.toast.create({ message, duration: 2200, color })).present();
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
