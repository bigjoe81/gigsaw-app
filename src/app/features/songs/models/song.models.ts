export { Song, SongStatus } from '../../../core/models/band-resources.models';

export interface SongMetadataCandidate {
  provider: 'spotify' | 'apple_music' | 'musicbrainz';
  externalId: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  releaseDate?: string | null;
  durationSeconds?: number | null;
  artworkUrl?: string | null;
  score: number;
  recordingMbid?: string | null;
  variantFlags?: string[];
}

export interface SongMetadataCredit {
  name: string;
  role: string;
}

export interface SongMetadataDetail extends SongMetadataCandidate {
  bpm?: number | null;
  credits?: SongMetadataCredit[];
  warnings?: string[];
}
