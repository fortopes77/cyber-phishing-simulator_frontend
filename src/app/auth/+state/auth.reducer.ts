import { User } from 'src/app/auth/auth.service';
import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user?: User;
  token?: string;
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
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...state,
    user: undefined,
    token: undefined,
    isAuthenticated: false,
  })),
);
