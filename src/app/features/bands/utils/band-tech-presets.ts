import { BandInputChannel, BandStagePlotItem } from '../models/band.models';

export function buildTechPreset(presetId: string): {
  label: string;
  stagePlotNotes: string;
  monitorMixNotes: string;
  backlineNotes: string;
  inputChannels: BandInputChannel[];
  stagePlotLayout: BandStagePlotItem[];
} | null {
  const stage = (label: string, instrument: string, x: number, y: number): BandStagePlotItem => ({
    id: crypto.randomUUID?.() ?? `${presetId}-${label}-${x}-${y}`,
    label,
    instrument,
    x,
    y,
  });

  switch (presetId) {
    case 'rock-quartet':
      return {
        label: 'Quartetto rock',
        stagePlotNotes: 'Batteria center upstage, voce lead front center, backline ai lati.',
        monitorMixNotes: 'Mix separati per lead vocal, chitarra e basso. Batterista con mix ritmico dedicato.',
        backlineNotes: '1 amp chitarra, 1 amp basso, drum kit standard 4 pezzi.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'OH L', source: 'Mic', notes: '' },
          { channel: 4, name: 'OH R', source: 'Mic', notes: '' },
          { channel: 5, name: 'Bass', source: 'DI', notes: '' },
          { channel: 6, name: 'Guitar', source: 'Mic', notes: 'Amp guitar' },
          { channel: 7, name: 'Lead Vox', source: 'Wireless', notes: '' },
        ],
        stagePlotLayout: [
          stage('Drums', 'Batteria', 50, 28),
          stage('Bass', 'Basso', 24, 48),
          stage('Guitar', 'Chitarra', 76, 48),
          stage('Lead Vox', 'Voce', 50, 72),
        ],
      };
    case 'power-trio':
      return {
        label: 'Power trio',
        stagePlotNotes: 'Setup compatto con batteria centrale e due front line laterali.',
        monitorMixNotes: 'Due mix frontali e un mix batteria.',
        backlineNotes: '1 amp basso, 1 amp chitarra, drum kit standard.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'OH', source: 'Mic', notes: '' },
          { channel: 4, name: 'Bass Vox', source: 'DI + Mic', notes: 'Split if needed' },
          { channel: 5, name: 'Guitar Vox', source: 'Mic + Mic', notes: 'Amp + vocal' },
        ],
        stagePlotLayout: [
          stage('Drums', 'Batteria', 50, 30),
          stage('Bass Vox', 'Basso', 28, 68),
          stage('Guitar Vox', 'Chitarra', 72, 68),
        ],
      };
    case 'pop-five':
      return {
        label: 'Pop 5 elementi',
        stagePlotNotes: 'Batteria upstage center, tastiere stage left, chitarra stage right, front line voce e basso.',
        monitorMixNotes: 'Lead vocal e tastiere con mix dedicato, sidefill opzionale.',
        backlineNotes: 'Stereo keys DI, guitar amp, bass amp, drum kit completo.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'Tom', source: 'Mic', notes: '' },
          { channel: 4, name: 'OH L', source: 'Mic', notes: '' },
          { channel: 5, name: 'OH R', source: 'Mic', notes: '' },
          { channel: 6, name: 'Bass', source: 'DI', notes: '' },
          { channel: 7, name: 'Guitar', source: 'Mic', notes: '' },
          { channel: 8, name: 'Keys L', source: 'DI', notes: 'Stereo pair' },
          { channel: 9, name: 'Keys R', source: 'DI', notes: 'Stereo pair' },
          { channel: 10, name: 'Lead Vox', source: 'Wireless', notes: '' },
        ],
        stagePlotLayout: [
          stage('Drums', 'Batteria', 50, 26),
          stage('Keys', 'Tastiere', 18, 46),
          stage('Bass', 'Basso', 34, 68),
          stage('Guitar', 'Chitarra', 72, 52),
          stage('Lead Vox', 'Voce', 50, 76),
        ],
      };
    case 'acoustic-duo':
      return {
        label: 'Duo acustico',
        stagePlotNotes: 'Setup frontale minimale con due voci e strumentazione acustica.',
        monitorMixNotes: 'Un mix per lato, riverbero leggero sulle voci.',
        backlineNotes: '2 DI acustiche, 2 vocal mic stand.',
        inputChannels: [
          { channel: 1, name: 'Acoustic 1', source: 'DI', notes: '' },
          { channel: 2, name: 'Vox 1', source: 'Mic', notes: '' },
          { channel: 3, name: 'Acoustic 2', source: 'DI', notes: '' },
          { channel: 4, name: 'Vox 2', source: 'Mic', notes: '' },
        ],
        stagePlotLayout: [
          stage('Performer 1', 'Voce / Chitarra', 36, 64),
          stage('Performer 2', 'Voce / Tastiere', 64, 64),
        ],
      };
    default:
      return null;
  }
}

export function buildInputChannelPreset(presetId: string): {
  label: string;
  monitorMixNotes: string;
  backlineNotes: string;
  inputChannels: BandInputChannel[];
} | null {
  switch (presetId) {
    case 'rock-basic-inputs':
      return {
        label: 'Canali rock base',
        monitorMixNotes: 'Mix dedicati per voce lead, chitarra e basso.',
        backlineNotes: 'Backline standard rock con amp chitarra e basso.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'OH', source: 'Mic', notes: '' },
          { channel: 4, name: 'Bass', source: 'DI', notes: '' },
          { channel: 5, name: 'Guitar', source: 'Mic', notes: '' },
          { channel: 6, name: 'Lead Vox', source: 'Mic', notes: '' },
        ],
      };
    case 'pop-extended-inputs':
      return {
        label: 'Canali pop estesi',
        monitorMixNotes: 'Lead vocal e tastiere con mix separati; sidefill opzionale.',
        backlineNotes: 'Richiesta stereo keys e possibilità di tracce/click su canali dedicati.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'Tom', source: 'Mic', notes: '' },
          { channel: 4, name: 'OH L', source: 'Mic', notes: '' },
          { channel: 5, name: 'OH R', source: 'Mic', notes: '' },
          { channel: 6, name: 'Bass', source: 'DI', notes: '' },
          { channel: 7, name: 'Guitar', source: 'Mic', notes: '' },
          { channel: 8, name: 'Keys L', source: 'DI', notes: '' },
          { channel: 9, name: 'Keys R', source: 'DI', notes: '' },
          { channel: 10, name: 'Lead Vox', source: 'Wireless', notes: '' },
          { channel: 11, name: 'Backing Vox', source: 'Mic', notes: '' },
          { channel: 12, name: 'Track / Click', source: 'DI', notes: 'Optional split' },
        ],
      };
    case 'drums-minimal':
      return {
        label: 'Drum miking minimale',
        monitorMixNotes: 'Kit microfonato in configurazione essenziale.',
        backlineNotes: 'Kick, snare e overhead; eventuali tom non microfonati.',
        inputChannels: [
          { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
          { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
          { channel: 3, name: 'OH Mono', source: 'Mic', notes: '' },
        ],
      };
    case 'drums-full':
      return {
        label: 'Drum miking completo',
        monitorMixNotes: 'Kit microfonato completo con immagine stereo overhead.',
        backlineNotes: 'Kick in/out, snare top/bottom, tom separati, hi-hat e overhead stereo.',
        inputChannels: [
          { channel: 1, name: 'Kick In', source: 'Mic', notes: '' },
          { channel: 2, name: 'Kick Out', source: 'Mic', notes: '' },
          { channel: 3, name: 'Snare Top', source: 'Mic', notes: '' },
          { channel: 4, name: 'Snare Bottom', source: 'Mic', notes: 'Phase reverse if needed' },
          { channel: 5, name: 'Hi-Hat', source: 'Mic', notes: '' },
          { channel: 6, name: 'Rack Tom', source: 'Mic', notes: '' },
          { channel: 7, name: 'Floor Tom', source: 'Mic', notes: '' },
          { channel: 8, name: 'OH L', source: 'Mic', notes: '' },
          { channel: 9, name: 'OH R', source: 'Mic', notes: '' },
        ],
      };
    default:
      return null;
  }
}

export function buildStagePlotPreset(presetId: string): {
  label: string;
  stagePlotNotes: string;
  stagePlotLayout: BandStagePlotItem[];
} | null {
  const stage = (label: string, instrument: string, x: number, y: number): BandStagePlotItem => ({
    id: crypto.randomUUID?.() ?? `${presetId}-${label}-${x}-${y}`,
    label,
    instrument,
    x,
    y,
  });

  switch (presetId) {
    case 'stage-rock-quartet':
      return {
        label: 'Stage rock quartet',
        stagePlotNotes: 'Batteria center upstage, basso e chitarra laterali, lead vocal downstage center.',
        stagePlotLayout: [
          stage('Drums', 'Batteria', 50, 28),
          stage('Bass', 'Basso', 24, 48),
          stage('Guitar', 'Chitarra', 76, 48),
          stage('Lead Vox', 'Voce', 50, 72),
        ],
      };
    case 'stage-pop-five':
      return {
        label: 'Stage pop 5 elementi',
        stagePlotNotes: 'Setup pop con tastiere stage left, chitarra stage right e voce lead front center.',
        stagePlotLayout: [
          stage('Drums', 'Batteria', 50, 26),
          stage('Keys', 'Tastiere', 18, 46),
          stage('Bass', 'Basso', 34, 68),
          stage('Guitar', 'Chitarra', 72, 52),
          stage('Lead Vox', 'Voce', 50, 76),
        ],
      };
    case 'stage-acoustic-duo':
      return {
        label: 'Stage duo acustico',
        stagePlotNotes: 'Due performer frontali con setup minimale e pochi ingombri.',
        stagePlotLayout: [
          stage('Performer 1', 'Voce / Chitarra', 36, 64),
          stage('Performer 2', 'Voce / Tastiere', 64, 64),
        ],
      };
    default:
      return null;
  }
}

export function stagePlotKind(value?: string | null): 'drums' | 'vocal' | 'bass' | 'guitar' | 'keys' | 'other' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return 'other';
  if (/(drum|batter|perc|kick|snare|tom|cassa)/.test(normalized)) return 'drums';
  if (/(vocal|voce|cant|lead vox|backing|mic)/.test(normalized)) return 'vocal';
  if (/(bass|basso)/.test(normalized)) return 'bass';
  if (/(guitar|chitar|gtr)/.test(normalized)) return 'guitar';
  if (/(keys|keyb|keyboard|piano|synth|tast)/.test(normalized)) return 'keys';
  return 'other';
}

export function stagePlotIcon(value?: string | null): string {
  return {
    drums: 'drum',
    vocal: 'mic-outline',
    bass: 'guitar',
    guitar: 'guitar',
    keys: 'keyboard',
    other: 'musical-notes-outline',
  }[stagePlotKind(value)];
}
