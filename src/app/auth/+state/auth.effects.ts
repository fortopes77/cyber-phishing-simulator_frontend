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
              refreshToken: response.refreshToken,
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
      withLatestFrom(this.store.select(selectAuthState)),
      mergeMap(([, auth]) => {
        // Nothing to revoke server-side if there's no refresh token (e.g.
        // the session was already cleared) - go straight to a local logout.
        if (!auth.refreshToken) {
          return of(AuthActions.logoutSuccess());
        }

        return this.authService.logout(auth.refreshToken).pipe(
          map(() => AuthActions.logoutSuccess()),
          // Sign-out must still succeed locally even if the server-side
          // revoke fails (network error, already-expired/rotated token,
          // etc.) - the user expects to be logged out of this app either
          // way, regardless of what the backend call did.
          catchError(() => of(AuthActions.logoutSuccess())),
        );
      }),
    ),
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      mergeMap(({ refreshToken }) =>
        this.authService.refreshToken(refreshToken).pipe(
          map((response) =>
            AuthActions.refreshTokenSuccess({
              token: response.token,
              refreshToken: response.refreshToken,
            }),
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

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      mergeMap(({ userId, firstName, lastName, email }) =>
        this.authService.updateProfile(userId, firstName, lastName, email).pipe(
          map((response: any) =>
            AuthActions.updateProfileSuccess({
              user: normalizeUser(response.user ?? response),
            }),
          ),
          catchError((error) =>
            of(
              AuthActions.updateProfileFailure({
                error: error.message || 'Failed to update profile',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.changePassword),
      mergeMap(({ userId, newPassword }) =>
        this.authService.changePassword(userId, newPassword).pipe(
          map(() => AuthActions.changePasswordSuccess()),
          catchError((error) =>
            of(
              AuthActions.changePasswordFailure({
                error: error.message || 'Failed to change password',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  forgotPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      mergeMap(({ email }) =>
        this.authService.forgotPassword(email).pipe(
          map(() => AuthActions.forgotPasswordSuccess()),
          catchError((error) =>
            of(
              AuthActions.forgotPasswordFailure({
                error: error.message || 'Failed to send password reset email',
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
  // updateProfileSuccess is included so an edited username/email survives a
  // reload too, instead of session-bootstrap silently restoring the stale
  // pre-edit values from storage.
  persistSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthActions.loginSuccess,
          AuthActions.refreshTokenSuccess,
          AuthActions.updateProfileSuccess,
        ),
        withLatestFrom(this.store.select(selectAuthState)),
        tap(([, auth]) => {
          if (auth.user && auth.token && auth.refreshToken) {
            saveSession(auth.user, auth.token, auth.refreshToken);
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
