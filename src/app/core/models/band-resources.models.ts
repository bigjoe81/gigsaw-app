export type SongStatus = 'draft' | 'active' | 'archived';

export interface BandScopedEntity {
  id: number;
  bandId?: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Song extends BandScopedEntity {
  album?: string | null;
  performedBy?: string | null;
  musicBy?: string | null;
  lyricsBy?: string | null;
  key?: string | null;
  bpm?: number | null;
  duration?: number | null;
  status?: SongStatus | null;
  notes?: string | null;
  linkGroup?: string | null;
  tags?: string[] | null;
}

export interface SetlistMemberNote {
  userId: number;
  notes: string;
}

export interface SetlistSong extends Song {
  setlistNotes?: string | null;
  memberNotes?: SetlistMemberNote[];
}

export interface RehearsalSession extends BandScopedEntity {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  rehearsalRoomId?: number | null;
  notes?: string | null;
}

export interface RecordingSession extends BandScopedEntity {
  date: string;
  songId?: number | null;
  location?: string | null;
  takeNumber?: number | null;
  audioUrl?: string | null;
  notes?: string | null;
}

export interface Gig extends BandScopedEntity {
  date: string;
  venueId?: number | null;
  notes?: string | null;
}

export interface Venue {
  id: number;
  bandId?: number;
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Setlist extends BandScopedEntity {
  bandId?: number;
  gigId?: number | null;
  venueId?: number | null;
  templateId?: number | null;
  date?: string | null;
  notes?: string | null;
  songIds?: number[];
  songEntries?: SetlistSong[];
  songs?: SetlistSong[];
  sets?: SetlistGeneratedSet[];
  generation?: SetlistGeneration | null;
}

export interface SetlistGeneratedSet {
  index: number;
  durationSeconds: number;
  targetDurationSeconds?: number | null;
  songIds: number[];
  songs: SetlistSong[];
}

export interface SetlistGeneration {
  gigId?: number | null;
  venueId?: number | null;
  referenceDate?: string | null;
  targetSongCount?: number | null;
  targetDurationSeconds?: number | null;
  totalShowDurationSeconds?: number | null;
  generatedDurationSeconds?: number | null;
  setCount?: number | null;
  setTargets?: number[];
  breakDurationSeconds?: number | null;
  generatedBreakDurationSeconds?: number | null;
  generatedFullShowDurationSeconds?: number | null;
  openingSongIds?: number[];
  closingSongIds?: number[];
  encoreSongIds?: number[];
  minDifferenceRatio?: number | null;
  slowSongBpmThreshold?: number | null;
  avoidAdjacentSameKey?: boolean;
  avoidAdjacentSlowSongs?: boolean;
  maxConsecutiveSlowSongs?: number | null;
  songTags?: string[];
  lastVenueSetlistId?: number | null;
  lastChronologicalSetlistId?: number | null;
  venueOverlapCount?: number | null;
  chronologicalOverlapCount?: number | null;
  venueDifferenceRatio?: number | null;
  chronologicalDifferenceRatio?: number | null;
}

export type BandResource = Song | RehearsalSession | RecordingSession | Gig | Venue | Setlist;
export type ResourceKey = 'songs' | 'rehearsal-sessions' | 'recording-sessions' | 'gigs' | 'venues' | 'setlists';
