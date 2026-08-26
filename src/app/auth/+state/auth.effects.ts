import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService, normalizeUser } from 'src/app/auth/auth.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { selectAuthState } from './auth.selectors';
import { clearSession, saveSession } from '../session-storage.util';
import { catchError, map, mergeMap, of, tap, withLatestFrom } from 'rxjs';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
    private store: Store,
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      mergeMap(({ credential, password }) =>
        this.authService.login(credential, password).pipe(
          map((response: any) =>
            AuthActions.loginSuccess({
              user: normalizeUser(response.user),
              token: response.token,
            }),
          ),
          catchError((error) =>
            of(
              AuthActions.loginFailure({
                error: error.message || 'Login failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => AuthActions.logoutSuccess()),
    ),
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      mergeMap(({ token }) =>
        this.authService.refreshToken(token).pipe(
          map((response) =>
            AuthActions.refreshTokenSuccess({ token: response.token }),
          ),
          catchError((error) =>
            of(
              AuthActions.refreshTokenFailure({
                error: error.message || 'Failed to refresh token',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // A failed refresh means the session can no longer be trusted, regardless
  // of what triggered it (AuthGuard finding an expired token, or the HTTP
  // interceptor catching a 401) - this is the single place that reacts by
  // sending the user back to login. The reducer has already cleared the
  // user/token from state by the time this runs.
  refreshTokenFailureRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        tap(() => this.router.navigate(['/login'])),
      ),
    { dispatch: false },
  );

  // Persists just enough (user + token) to survive a reload - see
  // session-storage.util.ts and session-bootstrap.ts. Reads the freshest
  // state after the reducer has applied the action rather than building the
  // payload from the action itself, so refreshTokenSuccess (which only
  // carries a new token) still persists alongside the existing user.
  persistSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.refreshTokenSuccess),
        withLatestFrom(this.store.select(selectAuthState)),
        tap(([, auth]) => {
          if (auth.user && auth.token) {
            saveSession(auth.user, auth.token);
          }
        }),
      ),
    { dispatch: false },
  );

  clearPersistedSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess, AuthActions.refreshTokenFailure),
        tap(() => clearSession()),
      ),
    { dispatch: false },
  );
}
