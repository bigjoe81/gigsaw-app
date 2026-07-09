import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ResourceKey } from '../models/band-resources.models';
import { BandContextService } from './band-context.service';
import { BandResourceApiService } from './band-resource-api.service';

export abstract class BandScopedCrudService<T extends { id: number }> {
  private readonly api = inject(BandResourceApiService);
  private readonly bandContext = inject(BandContextService);
  protected abstract readonly resource: ResourceKey;

  list(): Observable<T[]> { return this.withBand((bandId) => this.api.list<T>(bandId, this.resource)); }
  get(id: number): Observable<T> { return this.withBand((bandId) => this.api.get<T>(bandId, this.resource, id)); }
  create(payload: Partial<T>): Observable<T> { return this.withBand((bandId) => this.api.create<T>(bandId, this.resource, payload)); }
  update(id: number, payload: Partial<T>): Observable<T> { return this.withBand((bandId) => this.api.update<T>(bandId, this.resource, id, payload)); }
  delete(id: number): Observable<void> { return this.withBand((bandId) => this.api.delete(bandId, this.resource, id)); }

  private withBand<R>(operation: (bandId: number) => Observable<R>): Observable<R> {
    const bandId = this.bandContext.getCurrentBand();
    return bandId ? operation(bandId) : throwError(() => new Error('Nessuna band attiva selezionata.'));
  }
}
