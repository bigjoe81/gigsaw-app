import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForgotPasswordRequest, LoginRequest, LoginResponse, RegisterRequest, ResetPasswordRequest, User } from './auth.models';

const TOKEN_KEY = 'gigsaw.auth-token';
const REFRESH_TOKEN_KEY = 'gigsaw.refresh-token';
const GOOGLE_RETURN_URL_KEY = 'gigsaw.google-return-url';
const API_BASE_URL = `${environment.apiUrl}${environment.apiPath}`;
const SANCTUM_CSRF_COOKIE_URL = `${environment.apiUrl}/sanctum/csrf-cookie`;
type UserResponse = User | { data: User };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();
  readonly currentUser = signal<User | null>(null);
  private restoring = false;

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<LoginResponse | null>(`${API_BASE_URL}/login`, credentials)),
      tap((response) => this.storeTokens(response)),
      switchMap((response) => response?.user ? of(response.user) : this.fetchUser()),
      tap((user) => this.setUser(user)),
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<LoginResponse>(`${API_BASE_URL}/register`, payload)),
      tap((response) => this.storeTokens(response)),
      switchMap((response) => response.user ? of(response.user) : this.fetchUser()),
      tap((user) => this.setUser(user)),
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<{ status: string }> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<{ status: string }>(`${API_BASE_URL}/forgot-password`, payload)),
    );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<{ status: string }> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<{ status: string }>(`${API_BASE_URL}/reset-password`, payload)),
    );
  }

  restoreSession(): Observable<User | null> {
    if (this.restoring) return this.currentUser$;
    this.restoring = true;
    return this.fetchUser().pipe(
      tap((user) => this.setUser(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      finalize(() => { this.restoring = false; }),
    );
  }

  logout(navigate = true): Observable<void> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<void>(`${API_BASE_URL}/logout`, {})),
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession();
        if (navigate) void this.router.navigateByUrl('/login');
      }),
    );
  }

  /** Starts the server-side OAuth flow. Google credentials never reach the Ionic bundle. */
  startGoogleLogin(returnUrl = '/bands'): void {
    localStorage.setItem(GOOGLE_RETURN_URL_KEY, returnUrl);
    window.location.assign(`${environment.apiUrl}${environment.googleAuthPath}`);
  }

  completeGoogleLogin(code: string): Observable<User> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/google/exchange-code`, { code }).pipe(
      tap((response) => this.storeTokens(response)),
      switchMap((response) => response.user ? of(response.user) : this.fetchUser()),
      tap((user) => this.setUser(user)),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (!this.refreshToken) {
      return throwError(() => new Error('Refresh token mancante.'));
    }

    return this.http.post<LoginResponse>(`${API_BASE_URL}/refresh-token`, {}).pipe(
      tap((response) => this.storeTokens(response)),
      map((response) => response.accessToken ?? response.token ?? ''),
      switchMap((token) => token ? of(token) : throwError(() => new Error('Access token non restituito.'))),
    );
  }

  consumeGoogleReturnUrl(): string {
    const returnUrl = localStorage.getItem(GOOGLE_RETURN_URL_KEY) || '/bands';
    localStorage.removeItem(GOOGLE_RETURN_URL_KEY);
    return returnUrl.startsWith('/') ? returnUrl : '/bands';
  }

  handleUnauthorized(): void {
    if (!this.isAuthenticated && !this.token) return;
    this.clearSession();
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private fetchUser(): Observable<User> {
    return this.http.get<UserResponse>(`${API_BASE_URL}/me`).pipe(
      map((response): User => (response as { data?: User }).data ?? response as User),
    );
  }

  private ensureCsrfCookie(): Observable<unknown> {
    return this.http.get(SANCTUM_CSRF_COOKIE_URL, {
      responseType: 'text',
      withCredentials: true,
    });
  }

  private setUser(user: User): void {
    this.userSubject.next(user);
    this.currentUser.set(user);
  }

  private storeTokens(response: LoginResponse | null | undefined): void {
    const accessToken = response?.token ?? response?.accessToken ?? null;
    const refreshToken = response?.refreshToken ?? null;

    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.userSubject.next(null);
    this.currentUser.set(null);
  }
}
