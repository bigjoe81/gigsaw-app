export const GUIDED_COMPLETIONS = {
  repertorio: 'Brano salvato. Come vuoi continuare?',
  importazione: 'Repertorio importato. Come vuoi continuare?',
  concerto: 'Concerto salvato. Prepariamo il prossimo passo?',
  prova: 'Prova salvata. Come vuoi continuare?',
  scaletta: 'Scaletta salvata. Come vuoi continuare?',
} as const;

export type GuidedCompletion = keyof typeof GUIDED_COMPLETIONS;

export function parseGuidedCompletion(value: string | null): GuidedCompletion | null {
  return value && Object.hasOwn(GUIDED_COMPLETIONS, value) ? value as GuidedCompletion : null;
}

export function guidedCompletionUrl(currentUrl: string, bandId: number | undefined, completed: GuidedCompletion): string | null {
  if (!bandId || !currentUrl) return null;
  const url = new URL(currentUrl, 'https://gigsaw.invalid');
  if (url.searchParams.get('guidato') !== '1') return null;
  return `/band/${bandId}/inizia?completato=${completed}`;
}
