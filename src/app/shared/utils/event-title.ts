/** Parse calendar dates locally so timezone conversion cannot change the day. */
export function eventTitleDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** An untouched suggestion follows its source fields; custom text stays intact. */
export function nextEventTitle(current: string, previousSuggestion: string, suggestion: string): string {
  return !current.trim() || current === previousSuggestion ? suggestion : current;
}
