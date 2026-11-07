import type { SetlistItem, Song } from './band-resources.models';
/** Device-local Live contracts; no server synchronization is implied. */
export interface LiveEntry extends SetlistItem {
  id: string;
  section: string;
  song?: Song;
}
export interface LiveSession {
  id: string;
  band: string;
  title: string;
  location: string;
  entries: LiveEntry[];
  demo: boolean;
}
export interface LiveMarker {
  entryId: string;
  title: string;
  seconds: number;
}
export interface LiveTake {
  id: string;
  sessionId: string;
  title: string;
  startedAt: string;
  duration: number;
  mimeType: string;
  status: 'recording' | 'saved' | 'interrupted';
  markers: LiveMarker[];
}
export interface LiveDocument {
  id: string;
  name: string;
  mimeType: string;
  entryId: string;
}
