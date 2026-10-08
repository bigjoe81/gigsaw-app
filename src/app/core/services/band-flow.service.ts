import { Injectable } from '@angular/core';

export type BandFlow = 'building' | 'importing' | 'active';

@Injectable({ providedIn: 'root' })
export class BandFlowService {
  private readonly storagePrefix = 'gigsaw.band-flow.';

  get(bandId: number): BandFlow | null {
    if (!bandId) return null;
    const value = localStorage.getItem(`${this.storagePrefix}${bandId}`);
    return value === 'building' || value === 'importing' || value === 'active' ? value : null;
  }

  set(bandId: number, flow: BandFlow): void {
    if (!bandId) return;
    localStorage.setItem(`${this.storagePrefix}${bandId}`, flow);
  }

  clear(bandId: number): void {
    if (!bandId) return;
    localStorage.removeItem(`${this.storagePrefix}${bandId}`);
  }
}
