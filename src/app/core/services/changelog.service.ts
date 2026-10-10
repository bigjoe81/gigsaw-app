import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

export interface ChangelogRelease {
  id: string;
  date: string;
  label: string;
  title: string;
  summary: string;
  highlights: string[];
}

interface ChangelogDocument {
  current: string;
  releases: ChangelogRelease[];
}

@Injectable({ providedIn: 'root' })
export class ChangelogService {
  private static readonly storageKey = 'gigsaw:last-seen-changelog';
  private readonly http = inject(HttpClient);

  readonly changelog$: Observable<ChangelogDocument> = this.http
    .get<ChangelogDocument>('assets/changelog.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly currentRelease$ = this.changelog$.pipe(
    map((document) => document.releases.find((release) => release.id === document.current) ?? document.releases[0]),
  );

  hasUnread(currentReleaseId: string): boolean {
    return localStorage.getItem(ChangelogService.storageKey) !== currentReleaseId;
  }

  markAsRead(currentReleaseId: string): void {
    localStorage.setItem(ChangelogService.storageKey, currentReleaseId);
  }
}
