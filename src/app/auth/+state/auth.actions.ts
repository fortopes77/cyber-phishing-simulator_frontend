import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credential: string; password: string }>(),
    'Login Success': props<{ user: any; token: string; refreshToken: string }>(),
    'Login Failure': props<{ error: string }>(),
    // Dispatched once at app bootstrap (see session-bootstrap.ts) when a
    // persisted session is found in storage. Kept distinct from Login
    // Success so a page reload is never confused with an actual login in
    // the action log, even though the reducer applies the same state.
    'Session Restored': props<{ user: any; token: string; refreshToken: string }>(),
    Logout: emptyProps(),
    'Logout Success': emptyProps(),
    // The backend issues a separate, rotating refresh token (opaque string,
    // not the JWT access token) - that's what /auth/refresh expects, and
    // it's passed explicitly (from whichever slice of state/response
    // triggered the refresh) rather than read back out of storage, since
    // auth state now lives only in the NgRx store.
    'Refresh Token': props<{ refreshToken: string | undefined }>(),
    // The backend rotates the refresh token on every use (the old one is
    // invalidated), so the response's new refreshToken must be captured
    // here too, not just the new access token.
    'Refresh Token Success': props<{ token: string; refreshToken: string }>(),
    'Refresh Token Failure': props<{ error: string }>(),
    // `username` is deliberately absent - the backend's UpdateUserDto (PATCH
    // /users/{id}) has no field for it, so it can't be changed this way.
    'Update Profile': props<{
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
    }>(),
    'Update Profile Success': props<{ user: any }>(),
    'Update Profile Failure': props<{ error: string }>(),
    // Self-service password change from ProfileModalComponent. Its
    // success/failure are consumed directly via Actions$ in NavComponent
    // (which tracks its own local saving/error state for the modal) rather
    // than through auth.reducer, since neither outcome changes anything in
    // AuthState.
    'Reset Password': props<{ currentPassword: string; newPassword: string }>(),
    'Reset Password Success': emptyProps(),
    'Reset Password Failure': props<{ error: string }>(),
  },
});
