import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { DialogService, ToastService } from '../../../shared/ui/native-ui';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SetlistTemplate } from '../models/setlist.models';
import { SetlistService } from '../services/setlist.service';
import { GigsawListComponent, GigsawListItemComponent } from '../../../shared/ui/gigsaw';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, RouterLink, GigsawListComponent, GigsawListItemComponent, ],
  templateUrl: './setlist-template-detail.page.html',
})
export class SetlistTemplateDetailPage implements OnInit {
  template?: SetlistTemplate;
  loading = true;
  private id!: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly setlistsApi: SetlistService,
    private readonly alert: DialogService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('templateId'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.setlistsApi.getTemplate(this.id).subscribe({
      next: (template) => {
        this.template = template;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  formatSeconds(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  async confirmDelete(): Promise<void> {
    const dialog = await this.alert.create({
      header: 'Eliminare template?',
      message: 'L’operazione non può essere annullata.',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.delete() },
      ],
    });
    await dialog.present();
  }

  private delete(): void {
    this.setlistsApi.deleteTemplate(this.id).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Template eliminato.', duration: 1800, color: 'success' })).present();
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: async () => {
        (await this.toast.create({ message: 'Eliminazione non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }
}
