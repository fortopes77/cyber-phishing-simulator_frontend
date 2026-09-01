import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'trainer' | 'user';
  firstName?: string;
  lastName?: string;
  organisationId?: number;
}

// The backend's role enum ("LEARNER"/"TRAINER") doesn't match the lowercase
// 'user'/'trainer' literal the app routes and guards on (AuthGuard's
// ROLE_HOME, route data's `roles`, nav.component) - a plain .toLowerCase()
// would turn "LEARNER" into "learner", which matches nothing. Map explicitly
// instead.
const ROLE_MAP: Record<string, 'trainer' | 'user'> = {
  TRAINER: 'trainer',
  LEARNER: 'user',
};

/**
 * Normalizes a raw API role/user into the lowercase 'trainer'/'user'
 * literal used throughout the app for role checks (AuthGuard, nav.component,
 * login redirect).
 */
export function normalizeUser(raw: any): User {
  const rawRole = (raw?.role ?? '').toString().toUpperCase();
  return {
    ...raw,
    role: ROLE_MAP[rawRole] ?? rawRole.toLowerCase(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  /**
   * Login user with username/email and password
   * Accepts either username or email for credentials
   */
  login(credential: string, password: string) {
    return this.http.post(`${this.apiEndpoint}auth/login`, {
      credential,
      password,
    });
  }

  /**
   * Requests a fresh access token using the current refresh token. Per the
   * backend's Swagger contract (POST /auth/refresh, RefreshTokenDto), this
   * is a separate opaque `refreshToken` - not the JWT access token - and it
   * rotates: the response carries both a new access token and a new
   * refreshToken, and the one just used stops working. The caller (AuthGuard,
   * the auth HTTP interceptor) reads the current refreshToken from the NgRx
   * auth state, since nothing is persisted to localStorage beyond that.
   */
  refreshToken(refreshToken: string | undefined) {
    return this.http.post<{ token: string; refreshToken: string; user?: any }>(
      `${this.apiEndpoint}auth/refresh`,
      { refreshToken: refreshToken ?? null },
    );
  }

  getFeedback(payload: any) {
    return this.http.post(`${this.apiEndpoint}feedback`, payload);
  }

  /**
   * Revokes the current refresh token via POST /auth/logout (RefreshTokenDto)
   * so it can't be replayed after sign-out. Requires the access token too,
   * but that's attached automatically by the auth HTTP interceptor.
   */
  logout(refreshToken: string) {
    return this.http.post(`${this.apiEndpoint}auth/logout`, { refreshToken });
  }

  /**
   * Updates the signed-in user's own name/email via PATCH /users/{id}
   * (UpdateUserDto). The backend has no route to change `username` - it's
   * not part of UpdateUserDto - so it's intentionally left out of the
   * payload here even though the profile modal still displays it.
   */
  updateProfile(userId: string, firstName: string, lastName: string, email: string) {
    return this.http.patch(`${this.apiEndpoint}users/${userId}`, {
      firstName,
      lastName,
      email,
    });
  }

  /**
   * Changes the signed-in user's own password via PATCH /users/{id}
   * (UpdateUserDto) - the same endpoint updateProfile() uses. There's no
   * "verify current password, then change it" route on this backend:
   * POST /auth/reset-password takes a `token` (from the separate,
   * unauthenticated forgot-password flow via POST /auth/forgot-password),
   * not a current password, and rejects `currentPassword` outright since
   * ResetPasswordDto doesn't declare it.
   */
  changePassword(userId: string, newPassword: string) {
    return this.http.patch(`${this.apiEndpoint}users/${userId}`, {
      password: newPassword,
    });
  }

  /**
   * Requests a password-reset email for the given address via
   * POST /auth/forgot-password (ForgotPasswordDto) - unauthenticated (no
   * bearer token required), and the response is a generic "if an account
   * exists..." message regardless of whether the email is actually
   * registered, so there's nothing meaningful in the body to branch on.
   */
  forgotPassword(email: string) {
    return this.http.post(`${this.apiEndpoint}auth/forgot-password`, { email });
  }
}
