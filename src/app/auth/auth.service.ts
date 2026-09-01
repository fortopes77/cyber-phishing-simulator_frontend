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

  resetPassword(currentPassword: string, newPassword: string) {
    return this.http.post(`${this.apiEndpoint}auth/reset-password`, {
      currentPassword,
      newPassword,
    });
  }
}
