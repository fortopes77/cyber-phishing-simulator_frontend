import { User } from 'src/app/auth/auth.service';
import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { decodeTokenExpiry } from '../token.utils';

export interface AuthState {
  user?: User;
  token?: string;
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

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    isAuthenticated: true,
    token,
    tokenExpiresAt: decodeTokenExpiry(token),
    loading: false,
    error: undefined,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...state,
    user: undefined,
    token: undefined,
    tokenExpiresAt: undefined,
    isAuthenticated: false,
  })),

  on(AuthActions.refreshTokenSuccess, (state, { token }) => ({
    ...state,
    token,
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
    tokenExpiresAt: undefined,
    isAuthenticated: false,
  })),
);
