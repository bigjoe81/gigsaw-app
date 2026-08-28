export type PosterFormatId = 'instagram-post' | 'instagram-story' | 'square';

export type PosterFieldKey =
  | 'eventName' | 'date' | 'time' | 'venue' | 'city' | 'address' | 'admission';

export interface PosterFormat {
  id: PosterFormatId;
  label: string;
  width: number;
  height: number;
}

export interface PosterField {
  id: string;
  key: PosterFieldKey;
  label: string;
  sampleValue: string;
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  uppercase: boolean;
}

export interface PosterTemplateDocument {
  version: 1;
  format: PosterFormat;
  backgroundDataUrl: string | null;
  fields: PosterField[];
}

export interface PosterTemplate {
  id: string;
  bandId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  document: PosterTemplateDocument;
}

export const POSTER_FORMATS: readonly PosterFormat[] = [
  { id: 'instagram-post', label: 'Instagram post', width: 1080, height: 1350 },
  { id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'square', label: 'Quadrato', width: 1080, height: 1080 },
];

export const POSTER_FIELD_PRESETS: ReadonlyArray<Pick<PosterField, 'key' | 'label' | 'sampleValue'>> = [
  { key: 'eventName', label: 'Nome evento', sampleValue: 'GIGSAW LIVE' },
  { key: 'date', label: 'Data', sampleValue: '28 SETTEMBRE 2026' },
  { key: 'time', label: 'Ora', sampleValue: 'ORE 21:30' },
  { key: 'venue', label: 'Locale', sampleValue: 'THE SOUND CLUB' },
  { key: 'city', label: 'Città', sampleValue: 'MILANO' },
  { key: 'address', label: 'Indirizzo', sampleValue: 'VIA DELLA MUSICA 12' },
  { key: 'admission', label: 'Prezzo o ingresso', sampleValue: 'INGRESSO € 10' },
];
