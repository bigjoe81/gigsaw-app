import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Band, BandMember, BandPressKit, BandPressPhoto, CreateBandRequest, PendingBandInvitation, UpdateBandRequest } from '../models/band.models';

type ApiEnvelope<T> = T | { data: T };
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;

@Injectable({ providedIn: 'root' })
export class BandService {
  private readonly http = inject(HttpClient);

  listUserBands(): Observable<Band[]> {
    return this.http.get<ApiEnvelope<Band[]>>(`${API_BASE_URL}/bands/user`).pipe(
      map((response) => this.unwrap(response).map((band) => this.normalizeBand(band))),
    );
  }

  get(id: number): Observable<Band> {
    return this.http.get<ApiEnvelope<Band>>(`${API_BASE_URL}/bands/${id}`).pipe(
      map((response) => this.normalizeBand(this.unwrap(response))),
    );
  }

  create(payload: CreateBandRequest): Observable<Band> {
    return this.http.post<ApiEnvelope<Band>>(`${API_BASE_URL}/bands`, payload).pipe(
      map((response) => this.normalizeBand(this.unwrap(response))),
    );
  }

  update(bandId: number, payload: UpdateBandRequest): Observable<Band> {
    return this.http.put<ApiEnvelope<Band>>(
      `${API_BASE_URL}/bands/${bandId}`,
      this.toFormData(payload),
    ).pipe(
      map((response) => this.normalizeBand(this.unwrap(response))),
    );
  }

  uploadPressPhotos(bandId: number, files: File[]): Observable<Band> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files[]', file);
    }

    return this.http.post<ApiEnvelope<Band>>(`${API_BASE_URL}/bands/${bandId}/press-photos`, formData).pipe(
      map((response) => this.normalizeBand(this.unwrap(response))),
    );
  }

  deletePressPhoto(bandId: number, mediaId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/bands/${bandId}/press-photos/${mediaId}`);
  }

  pressKit(bandId: number): Observable<BandPressKit> {
    return this.http.get<ApiEnvelope<BandPressKit>>(`${API_BASE_URL}/bands/${bandId}/press-kit`).pipe(
      map((response) => this.normalizePressKit(this.unwrap(response))),
    );
  }

  pressKitPdf(bandId: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/bands/${bandId}/press-kit/pdf`, {
      responseType: 'blob',
    });
  }

  techRiderPdf(bandId: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/bands/${bandId}/tech-rider/pdf`, {
      responseType: 'blob',
    });
  }

  mediaPackZip(bandId: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/bands/${bandId}/media-pack.zip`, {
      responseType: 'blob',
    });
  }

  join(joinCode: string): Observable<Band> {
    return this.http.post<ApiEnvelope<Band>>(`${API_BASE_URL}/bands/join`, {
      join_code: joinCode,
    }).pipe(
      map((response) => this.normalizeBand(this.unwrap(response))),
    );
  }

  invite(bandId: number, payload: { email: string; name: string; role: string }): Observable<PendingBandInvitation> {
    return this.http.post<ApiEnvelope<PendingBandInvitation>>(`${API_BASE_URL}/bands/${bandId}/user/invite`, payload).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  updateMemberRole(bandId: number, userId: number, role: string): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/bands/${bandId}/user/${userId}/role`, { role });
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    return typeof response === 'object' && response !== null && 'data' in response
      ? response.data
      : response;
  }

  private normalizeBand(band: any): Band {
    return {
      id: band.id,
      name: band.name,
      joinCode: band.joinCode ?? band.join_code ?? null,
      currentUserRole: band.currentUserRole ?? band.current_user_role ?? null,
      cover: band.cover ?? null,
      logo: band.logo ?? null,
      bioShort: band.bioShort ?? band.bio_short ?? null,
      bio: band.bio ?? null,
      city: band.city ?? null,
      country: band.country ?? null,
      email: band.email ?? null,
      phone: band.phone ?? null,
      website: band.website ?? null,
      instagramUrl: band.instagramUrl ?? band.instagram_url ?? null,
      facebookUrl: band.facebookUrl ?? band.facebook_url ?? null,
      youtubeUrl: band.youtubeUrl ?? band.youtube_url ?? null,
      spotifyUrl: band.spotifyUrl ?? band.spotify_url ?? null,
      tiktokUrl: band.tiktokUrl ?? band.tiktok_url ?? null,
      soundEngineerNotes: band.soundEngineerNotes ?? band.sound_engineer_notes ?? null,
      stagePlotNotes: band.stagePlotNotes ?? band.stage_plot_notes ?? null,
      monitorMixNotes: band.monitorMixNotes ?? band.monitor_mix_notes ?? null,
      backlineNotes: band.backlineNotes ?? band.backline_notes ?? null,
      hospitalityNotes: band.hospitalityNotes ?? band.hospitality_notes ?? null,
      inputChannels: band.inputChannels ?? band.input_channels ?? [],
      stagePlotLayout: band.stagePlotLayout ?? band.stage_plot_layout ?? [],
      genres: band.genres ?? [],
      pressPhotos: this.normalizePressPhotos(band.pressPhotos ?? band.press_photos ?? []),
      members: (band.members ?? []).map((member: any): BandMember => ({
        id: member.id,
        name: member.name,
        role: member.role ?? null,
        status: member.status ?? null,
      })),
      invitations: (band.invitations ?? []).map((invitation: any): PendingBandInvitation => ({
        id: invitation.id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role ?? null,
      })),
    };
  }

  private normalizePressKit(pressKit: any): BandPressKit {
    return {
      id: pressKit.id,
      name: pressKit.name,
      bioShort: pressKit.bioShort ?? pressKit.bio_short ?? null,
      bio: pressKit.bio ?? null,
      city: pressKit.city ?? null,
      country: pressKit.country ?? null,
      email: pressKit.email ?? null,
      phone: pressKit.phone ?? null,
      website: pressKit.website ?? null,
      instagramUrl: pressKit.instagramUrl ?? pressKit.instagram_url ?? null,
      facebookUrl: pressKit.facebookUrl ?? pressKit.facebook_url ?? null,
      youtubeUrl: pressKit.youtubeUrl ?? pressKit.youtube_url ?? null,
      spotifyUrl: pressKit.spotifyUrl ?? pressKit.spotify_url ?? null,
      tiktokUrl: pressKit.tiktokUrl ?? pressKit.tiktok_url ?? null,
      soundEngineerNotes: pressKit.soundEngineerNotes ?? pressKit.sound_engineer_notes ?? null,
      stagePlotNotes: pressKit.stagePlotNotes ?? pressKit.stage_plot_notes ?? null,
      monitorMixNotes: pressKit.monitorMixNotes ?? pressKit.monitor_mix_notes ?? null,
      backlineNotes: pressKit.backlineNotes ?? pressKit.backline_notes ?? null,
      hospitalityNotes: pressKit.hospitalityNotes ?? pressKit.hospitality_notes ?? null,
      inputChannels: pressKit.inputChannels ?? pressKit.input_channels ?? [],
      stagePlotLayout: pressKit.stagePlotLayout ?? pressKit.stage_plot_layout ?? [],
      genres: pressKit.genres ?? [],
      members: (pressKit.members ?? []).map((member: any): BandMember => ({
        id: member.id,
        name: member.name,
        role: member.role ?? null,
        status: member.status ?? null,
      })),
      logo: pressKit.logo ?? null,
      cover: pressKit.cover ?? null,
      pressPhotos: this.normalizePressPhotos(pressKit.pressPhotos ?? pressKit.press_photos ?? []),
    };
  }

  private normalizePressPhotos(photos: any[]): BandPressPhoto[] {
    return photos.map((photo: any) => ({
      id: photo.id,
      fileName: photo.fileName ?? photo.file_name ?? null,
      url: photo.url ?? null,
      previewUrl: photo.previewUrl ?? photo.preview_url ?? null,
    }));
  }

  private toFormData(payload: UpdateBandRequest): FormData {
    const formData = new FormData();
    formData.append('name', payload.name);

    for (const genreId of payload.genres ?? []) {
      formData.append('genres[]', String(genreId));
    }

    if (payload.logo) {
      formData.append('logo', payload.logo);
    }

    this.appendNullable(formData, 'bio_short', payload.bioShort);
    this.appendNullable(formData, 'bio', payload.bio);
    this.appendNullable(formData, 'city', payload.city);
    this.appendNullable(formData, 'country', payload.country);
    this.appendNullable(formData, 'email', payload.email);
    this.appendNullable(formData, 'phone', payload.phone);
    this.appendNullable(formData, 'website', payload.website);
    this.appendNullable(formData, 'instagram_url', payload.instagramUrl);
    this.appendNullable(formData, 'facebook_url', payload.facebookUrl);
    this.appendNullable(formData, 'youtube_url', payload.youtubeUrl);
    this.appendNullable(formData, 'spotify_url', payload.spotifyUrl);
    this.appendNullable(formData, 'tiktok_url', payload.tiktokUrl);
    this.appendJsonNullable(formData, 'input_channels', payload.inputChannels);
    this.appendJsonNullable(formData, 'stage_plot_layout', payload.stagePlotLayout);
    this.appendNullable(formData, 'sound_engineer_notes', payload.soundEngineerNotes);
    this.appendNullable(formData, 'stage_plot_notes', payload.stagePlotNotes);
    this.appendNullable(formData, 'monitor_mix_notes', payload.monitorMixNotes);
    this.appendNullable(formData, 'backline_notes', payload.backlineNotes);
    this.appendNullable(formData, 'hospitality_notes', payload.hospitalityNotes);

    return formData;
  }

  private appendNullable(formData: FormData, key: string, value: string | null | undefined): void {
    if (value !== undefined) {
      formData.append(key, value ?? '');
    }
  }

  private appendJsonNullable(formData: FormData, key: string, value: unknown): void {
    if (value !== undefined) {
      formData.append(key, JSON.stringify(value ?? []));
    }
  }
}
