import { Song } from '../../../core/models/band-resources.models';

export type WorkspaceItemType = 'song' | 'pause' | 'speech' | 'stage-note';
export interface SetlistItem {
  id: string; type: WorkspaceItemType; song?: Song; title: string; durationSeconds: number;
  concertKey?: string; singer?: string; intro?: string; ending?: string; transition?: string;
  sharedNotes?: string; personalNotes?: string; segue?: boolean; pending?: boolean;
  medleyId?: string; locked?: boolean;
}
export interface WorkspaceSet { id: string; name: string; targetSeconds?: number; encore?: boolean; items: SetlistItem[]; }
export interface SetlistWorkspace { id: string; title: string; gigLabel?: string; sets: WorkspaceSet[]; updatedAt: string; }
export interface MagicConstraints {
  totalSeconds: number; setCount: number; setSeconds: number; breakSeconds: number;
  minSongs?: number; maxSongs?: number; openingSongId?: number; closingSongId?: number;
  requiredSongIds: number[]; excludedSongIds: number[]; encoreSongIds: number[];
  consecutiveGroups: number[][]; separatedPairs: number[][]; mandatoryMedleys: number[][];
  balanceSingers: boolean; energyCurve: 'rising' | 'wave' | 'balanced'; alternateGenres: boolean;
  separateSameKeys: boolean; maxDraftSongs: number; preferLiveReady: boolean;
}
export interface ValidationIssue { id: string; severity: 'error' | 'warning' | 'suggestion'; message: string; setId?: string; itemId?: string; }
export interface MagicProposal { id: string; prompt: string; sets: WorkspaceSet[]; respected: string[]; unmet: string[]; reasons: string[]; createdAt: string; }
export interface SetlistSnapshot { id: string; label: string; workspace: SetlistWorkspace; createdAt: string; }
