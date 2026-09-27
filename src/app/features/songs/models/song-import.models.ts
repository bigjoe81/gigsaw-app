export type SongImportKind = 'spreadsheet' | 'pdf';

export interface SongImportCandidate {
  externalId: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  durationSeconds?: number | null;
}

export interface SongImportInput {
  title: string;
  performedBy?: string;
  isCover?: boolean;
  key?: string;
  duration?: number | null;
  status?: string;
  album?: string;
  notes?: string;
  bpm?: number | null;
  tags?: string[];
}

export interface SongImportRow {
  rowNumber: number;
  input: SongImportInput;
  lookupStatus: 'not_requested' | 'not_found' | 'matched' | 'multiple_matches';
  candidates: SongImportCandidate[];
  recommendedCandidateExternalId?: string | null;
  duplicateExisting: boolean;
  ready: boolean;
  errors: string[];
  confidence?: number;
  selected: boolean;
  useMetadata: boolean;
  candidateExternalId: string;
}

export interface SongImportReview {
  importToken: string;
  source?: string;
  rows: SongImportRow[];
  summary: { totalRows: number; readyRows: number; matchedRows: number; duplicateRows: number };
}

export interface SongImportResult {
  createdCount: number;
  skippedCount: number;
  created: Array<{ rowNumber: number; songId: number; title: string }>;
  skipped: Array<{ rowNumber: number; reason: string }>;
}
