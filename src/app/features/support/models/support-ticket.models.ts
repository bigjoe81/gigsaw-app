export type SupportTicketCategory = 'bug' | 'question' | 'feature' | 'billing' | 'other';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high';

export interface SupportTicketMessage {
  id: number;
  user_id: number | null;
  author_type: 'user' | 'admin';
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  band_id: number | null;
  subject: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  messages_count?: number;
  band?: { id: number; name: string } | null;
  messages?: SupportTicketMessage[];
}

export interface CreateSupportTicketRequest {
  band_id?: number | null;
  subject: string;
  category: SupportTicketCategory;
  message: string;
}
