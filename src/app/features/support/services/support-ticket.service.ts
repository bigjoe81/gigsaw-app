import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateSupportTicketRequest, SupportTicket } from '../models/support-ticket.models';

const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
  private readonly http = inject(HttpClient);

  list(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${API_BASE_URL}/support-tickets`);
  }

  get(id: number): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${API_BASE_URL}/support-tickets/${id}`);
  }

  create(payload: CreateSupportTicketRequest): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${API_BASE_URL}/support-tickets`, payload);
  }

  reply(id: number, message: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${API_BASE_URL}/support-tickets/${id}/reply`, { message });
  }
}
