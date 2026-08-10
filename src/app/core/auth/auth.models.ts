export interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export type OtpPurpose = 'login' | 'register';

export interface RequestOtpRequest {
  email: string;
  purpose: OtpPurpose;
  name?: string;
}

export interface AuthOtpChallenge {
  challengeId: number;
  email: string;
  intent: OtpPurpose;
  expiresAt?: string | null;
  resendAvailableAt?: string | null;
}

export interface RequestOtpResponse {
  message: string;
  challenge: AuthOtpChallenge;
}

export interface VerifyOtpRequest {
  challengeId: number;
  code: string;
  purpose: OtpPurpose;
}

export interface ResendOtpRequest {
  challengeId: number;
  purpose: OtpPurpose;
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
