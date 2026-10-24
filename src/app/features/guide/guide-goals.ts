export type GuideGoal = 'repertoire' | 'gig' | 'rehearsal';

export const GUIDE_GOALS: ReadonlyArray<{ key: GuideGoal; title: string; text: string; icon: string }> = [
  { key: 'repertoire', title: 'Costruire il repertorio', text: 'Aggiungiamo i brani che volete suonare.', icon: 'musical-notes-outline' },
  { key: 'gig', title: 'Preparare un concerto', text: 'Partiamo dalla data o dalla scaletta.', icon: 'radio-outline' },
  { key: 'rehearsal', title: 'Organizzare una prova', text: 'Decidiamo quando trovarci o cosa suonare.', icon: 'mic-outline' },
];

export function parseGuideGoal(value: string | null): GuideGoal | null {
  return GUIDE_GOALS.find((goal) => goal.key === value)?.key ?? null;
}
