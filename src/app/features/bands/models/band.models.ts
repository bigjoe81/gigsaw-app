export interface BandMember {
  id: number;
  name: string;
  role?: string;
  status?: string;
}

export interface PendingBandInvitation {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface BandGenre {
  id?: number;
  name?: string;
}

export interface BandPressPhoto {
  id: number;
  fileName?: string | null;
  url?: string | null;
  previewUrl?: string | null;
}

export interface BandStagePlotItem {
  id?: string | null;
  label: string;
  instrument?: string | null;
  x: number;
  y: number;
}

export interface BandPressKit {
  id: number;
  name: string;
  bioShort?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  tiktokUrl?: string | null;
  soundEngineerNotes?: string | null;
  stagePlotNotes?: string | null;
  monitorMixNotes?: string | null;
  backlineNotes?: string | null;
  hospitalityNotes?: string | null;
  inputChannels?: BandInputChannel[];
  stagePlotLayout?: BandStagePlotItem[];
  genres?: BandGenre[];
  members?: BandMember[];
  logo?: string | null;
  cover?: string | null;
  pressPhotos?: BandPressPhoto[];
}

export interface BandInputChannel {
  channel: number;
  name: string;
  source?: string | null;
  notes?: string | null;
}

export interface Band {
  id: number;
  name: string;
  joinCode?: string | null;
  currentUserRole?: string | null;
  cover?: string | null;
  logo?: string | null;
  bioShort?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  tiktokUrl?: string | null;
  soundEngineerNotes?: string | null;
  stagePlotNotes?: string | null;
  monitorMixNotes?: string | null;
  backlineNotes?: string | null;
  hospitalityNotes?: string | null;
  inputChannels?: BandInputChannel[];
  stagePlotLayout?: BandStagePlotItem[];
  genres?: BandGenre[];
  members?: BandMember[];
  invitations?: PendingBandInvitation[];
  pressPhotos?: BandPressPhoto[];
}

export interface CreateBandRequest {
  name: string;
}

export interface UpdateBandRequest {
  name: string;
  genres?: number[];
  logo?: File | null;
  bioShort?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  tiktokUrl?: string | null;
  soundEngineerNotes?: string | null;
  stagePlotNotes?: string | null;
  monitorMixNotes?: string | null;
  backlineNotes?: string | null;
  hospitalityNotes?: string | null;
  inputChannels?: BandInputChannel[];
  stagePlotLayout?: BandStagePlotItem[];
}
