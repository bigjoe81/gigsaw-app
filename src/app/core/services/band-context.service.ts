import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'gigsaw.active-band-id';

@Injectable({ providedIn: 'root' })
export class BandContextService {
  private readonly activeBandIdSubject = new BehaviorSubject<number | null>(this.readStoredBandId());
  readonly activeBandId$ = this.activeBandIdSubject.asObservable();
  /** Alias used by feature code; bands can be loaded independently when needed. */
  readonly currentBand$ = this.activeBandId$;

  get activeBandId(): number | null {
    return this.activeBandIdSubject.value;
  }

  setActiveBandId(bandId: number): void {
    this.activeBandIdSubject.next(bandId);
    localStorage.setItem(STORAGE_KEY, String(bandId));
  }

  setCurrentBand(bandId: number): void {
    this.setActiveBandId(bandId);
  }

  getCurrentBand(): number | null {
    return this.activeBandId;
  }

  clearActiveBand(): void {
    this.activeBandIdSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readStoredBandId(): number | null {
    const value = localStorage.getItem(STORAGE_KEY);
    const id = value ? Number(value) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
