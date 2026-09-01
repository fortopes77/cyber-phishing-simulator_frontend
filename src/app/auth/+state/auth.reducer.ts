import { User } from 'src/app/auth/auth.service';
import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { decodeTokenExpiry } from '../token.utils';

export interface AuthState {
  user?: User;
  token?: string;
  // The opaque, rotating token /auth/refresh expects - distinct from the
  // JWT access token above. Rotated (a new one issued, the old one
  // invalidated) on every successful refresh.
  refreshToken?: string;
  // Epoch ms the current token expires at - used to decide whether a
  // rehydrated (page-refresh) session is still usable, and to trigger a
  // refresh via AuthGuard/the auth HTTP interceptor.
  tokenExpiresAt?: number;
  loading: boolean;
  error?: string;
  isAuthenticated: boolean;
}

export const initialAuthState: AuthState = {
  loading: false,
  isAuthenticated: false,
};

// Shared by loginSuccess and sessionRestored - a rehydrated session (see
// session-bootstrap.ts) puts the store in exactly the same state a fresh
// login would, just without a loading phase.
const applyAuthenticatedSession = (
  state: AuthState,
  { user, token, refreshToken }: { user: User; token: string; refreshToken: string },
): AuthState => ({
  ...state,
  user,
  isAuthenticated: true,
  token,
  refreshToken,
  tokenExpiresAt: decodeTokenExpiry(token),
  loading: false,
  error: undefined,
});

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.loginSuccess, applyAuthenticatedSession),
  on(AuthActions.sessionRestored, applyAuthenticatedSession),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...state,
    user: undefined,
    token: undefined,
    refreshToken: undefined,
    tokenExpiresAt: undefined,
    isAuthenticated: false,
  })),

  on(AuthActions.refreshTokenSuccess, (state, { token, refreshToken }) => ({
    ...state,
    token,
    refreshToken,
    tokenExpiresAt: decodeTokenExpiry(token),
    isAuthenticated: true,
    error: undefined,
  })),

  // A failed refresh means the session can no longer be trusted - clear it
  // the same way a logout would, so the guard sends the learner back to
  // login instead of silently retrying with a dead token.
  on(AuthActions.refreshTokenFailure, (state) => ({
    ...state,
    user: undefined,
    token: undefined,
    refreshToken: undefined,
    tokenExpiresAt: undefined,
    isAuthenticated: false,
  })),

  on(AuthActions.updateProfile, (state) => ({
    ...state,
    loading: true,
    error: undefined,
  })),
  on(AuthActions.updateProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: undefined,
  })),
  on(AuthActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
