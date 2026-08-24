import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
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
              user: response.user,
              token: response.token,
            }),
          ),
          catchError((error) =>
            of(
              AuthActions.loginFailure({
                error:
                  'Unable to login, please contact your organisation admin.',
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
}
