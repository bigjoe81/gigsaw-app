import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { DialogService, ToastService } from '../../../shared/ui/native-ui';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Gig } from '../../../core/models/band-resources.models';
import { GigPostersComponent, GigPosterValues } from '../../poster-templates/components/gig-posters.component';
import { GigService } from '../services/gig.service';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, GigPostersComponent, RouterLink, ],
  templateUrl: './gig-detail.page.html',
  styleUrl: './gig-detail.page.scss',
})
export class GigDetailPage implements OnInit {
  readonly gig = signal<Gig | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal('');
  private id!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gigsApi: GigService,
    private readonly alert: DialogService,
    private readonly toast: ToastService,
  ) {

  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.gigsApi.get(this.id).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (gig) => this.gig.set(gig),
      error: () => this.error.set('Impossibile caricare il concerto.'),
    });
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.dateValue(value));
  }

  time(value: string): string | null {
    return value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? null;
  }

  venueAddress(gig: Gig): string {
    return [gig.venue?.address, gig.venue?.city].filter(Boolean).join(' · ');
  }

  get posterBandId(): string {
    let route: ActivatedRoute | null = this.route;
    while (route) {
      const id = route.snapshot.paramMap.get('bandId');
      if (id) return id;
      route = route.parent;
    }
    return String(this.gig()?.bandId ?? '');
  }

  get posterValues(): GigPosterValues {
    const gig = this.gig();
    return { title: gig?.title ?? '', date: gig?.date.slice(0, 10) ?? '', time: gig ? this.time(gig.date) ?? '' : '',
      venue: gig?.venue?.name ?? '', city: gig?.venue?.city ?? '', address: gig?.venue?.address ?? '', admission: '' };
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare il concerto?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.gigsApi.delete(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Concerto eliminato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private dateValue(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
  }
}
