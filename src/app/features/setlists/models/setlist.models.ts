import { Setlist, SetlistMemberNote, Song } from '../../../core/models/band-resources.models';

export interface SetlistSongEntryPayload {
  songId: number;
  notes?: string | null;
  memberNotes?: SetlistMemberNote[];
}

export interface SetlistTemplate {
  id: number;
  bandId: number;
  name: string;
  description?: string | null;
  openingSongIds?: number[];
  closingSongIds?: number[];
  encoreSongIds?: number[];
  targetSongCount?: number | null;
  totalShowDurationSeconds?: number | null;
  setCount?: number | null;
  setTargets?: number[];
  breakDurationSeconds?: number | null;
  minDifferenceRatio?: number | null;
  slowSongBpmThreshold?: number | null;
  avoidAdjacentSameKey?: boolean;
  avoidAdjacentSlowSongs?: boolean;
  maxConsecutiveSlowSongs?: number | null;
  songTags?: string[];
}

export interface SetlistUpsertPayload {
  title: string;
  date?: string | null;
  gigId?: number | null;
  notes?: string | null;
  songIds?: number[];
  songEntries?: SetlistSongEntryPayload[];
}

export interface SetlistGeneratePayload {
  templateId?: number | null;
  gigId?: number | null;
  venueId?: number | null;
  referenceDate?: string | null;
  title?: string | null;
  notes?: string | null;
  targetSongCount?: number | null;
  totalShowDurationSeconds?: number | null;
  setCount?: number | null;
  setTargets?: number[];
  breakDurationSeconds?: number | null;
  openingSongIds?: number[];
  closingSongIds?: number[];
  encoreSongIds?: number[];
  minDifferenceRatio?: number | null;
  slowSongBpmThreshold?: number | null;
  avoidAdjacentSameKey?: boolean;
  avoidAdjacentSlowSongs?: boolean;
  maxConsecutiveSlowSongs?: number | null;
  songTags?: string[];
  save?: boolean;
}

export interface SetlistSongOption extends Song {
  selected?: boolean;
}

export type SetlistPreview = Setlist;
