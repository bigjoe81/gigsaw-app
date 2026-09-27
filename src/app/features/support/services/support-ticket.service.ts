import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

export type SupportCategory = 'bug' | 'suggestion' | 'support' | 'other';

export interface SupportTicketRequest {
  category: SupportCategory;
  subject: string;
  description: string;
  band_id?: number | null;
  context?: {
    page_url?: string;
    app_version?: string;
    user_agent?: string;
  };
}

export interface SupportTicketResponse {
  message: string;
  ticket: {
    id: string | null;
    number: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
  constructor(private readonly http: HttpClient) {}

  create(payload: SupportTicketRequest): Observable<SupportTicketResponse> {
    return this.http.post<SupportTicketResponse>(`${API_BASE_URL}/support/tickets`, payload);
  }
}
