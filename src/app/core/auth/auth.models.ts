export interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  password_confirmation: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Supports both cookie-only Sanctum login (204) and token-based responses. */
export interface LoginResponse {
  user?: User;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}
