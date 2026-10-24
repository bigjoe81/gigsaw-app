import { Injectable } from '@angular/core';

export type BandFlow = 'building' | 'importing' | 'active';

export interface BandFlowStats {
  songs: number;
  rehearsals: number;
  gigs: number;
}

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

  infer(stats: BandFlowStats, preferred?: BandFlow | null): BandFlow {
    const hasSongs = stats.songs > 0;
    const hasActivity = stats.rehearsals > 0 || stats.gigs > 0;

    // A completely empty band is always in construction, even if it predates
    // the scenario onboarding and therefore has no saved preference.
    if (!hasSongs && !hasActivity) return 'building';

    // As soon as rehearsals or gigs exist, the operational context becomes active.
    if (hasActivity) return 'active';

    // Songs without activity usually means an existing list/repertoire that still
    // needs to be organised. Keep an explicit "building" preference when the band
    // deliberately said those songs are still being prepared.
    if (hasSongs) return preferred === 'building' ? 'building' : 'importing';

    return preferred ?? 'building';
  }
}
