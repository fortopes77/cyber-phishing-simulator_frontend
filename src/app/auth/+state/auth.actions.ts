import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credential: string; password: string }>(),
    'Login Success': props<{ user: any; token: string }>(),
    'Login Failure': props<{ error: string }>(),
    // Dispatched once at app bootstrap (see session-bootstrap.ts) when a
    // persisted session is found in storage. Kept distinct from Login
    // Success so a page reload is never confused with an actual login in
    // the action log, even though the reducer applies the same state.
    'Session Restored': props<{ user: any; token: string }>(),
    Logout: emptyProps(),
    'Logout Success': emptyProps(),
    // The token being refreshed is passed explicitly (from whichever slice
    // of state/response triggered the refresh) rather than read back out of
    // storage, since auth state now lives only in the NgRx store.
    'Refresh Token': props<{ token: string | undefined }>(),
    'Refresh Token Success': props<{ token: string }>(),
    'Refresh Token Failure': props<{ error: string }>(),
  },
});
