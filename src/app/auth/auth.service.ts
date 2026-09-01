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
}

/**
 * The backend returns role as "TRAINER"/"USER" (all caps) rather than the
 * lowercase values used throughout the app for role checks (AuthGuard,
 * nav.component, login redirect). Normalize once here, right where the raw
 * API response is turned into a User, so every downstream comparison can
 * keep using the lowercase literal.
 */
export function normalizeUser(raw: any): User {
  return {
    ...raw,
    role: (raw?.role ?? '').toString().toLowerCase(),
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
   * Requests a fresh token for the current session. `token` is the
   * (possibly expired) access token from the NgRx auth state - the caller
   * (AuthGuard, the auth HTTP interceptor) already has it from the store,
   * since nothing is persisted to localStorage any more.
   * ASSUMPTION: backend exposes POST /auth/refresh accepting the current
   * token and returning a new one in the same shape as login - update the
   * payload/response mapping if your NestJS route differs (e.g. a separate
   * refresh token rather than reusing the access token).
   */
  refreshToken(token: string | undefined) {
    return this.http.post<{ token: string }>(
      `${this.apiEndpoint}auth/refresh`,
      { token: token ?? null },
    );
  }

  getFeedback(payload: any) {
    return this.http.post(`${this.apiEndpoint}feedback`, payload);
  }

  // ASSUMPTION: no "update my profile"/"change my password" controller was
  // included in this upload - these mirror the auth/login, auth/refresh
  // naming convention. Update the path/payload mapping once a real contract
  // is available.
  updateProfile(firstName: string, lastName: string, username: string, email: string) {
    return this.http.patch(`${this.apiEndpoint}auth/profile`, {
      firstName,
      lastName,
      username,
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
