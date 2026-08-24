import { Injectable } from '@angular/core';
import { AuthService, normalizeUser } from 'src/app/auth/auth.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { catchError, map, mergeMap, of } from 'rxjs';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
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

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        map(() => {
          this.authService.logout();
          return AuthActions.logoutSuccess();
        }),
      ),
    { dispatch: true },
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      mergeMap(() =>
        this.authService.refreshToken().pipe(
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
}
