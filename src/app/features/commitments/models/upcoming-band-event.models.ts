export type UpcomingEventType = 'rehearsal' | 'gig';

export interface UpcomingBandEvent {
  id: string;
  bandId: number;
  type: UpcomingEventType;
  eventId: number;
  title: string;
  date: string;
  timestamp: number;
  time?: string | null;
  location?: string | null;
}
