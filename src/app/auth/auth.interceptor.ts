import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthActions } from './+state/auth.actions';
import { selectToken } from './+state/auth.selectors';

// Requests to these endpoints must never be retried through the refresh
// flow, or a bad login/refresh could recurse into itself.
const AUTH_ENDPOINT_SKIP_PATTERNS = ['auth/login', 'auth/refresh'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINT_SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Attaches the current token to every outgoing request (replacing the
 * per-service `localStorage.getItem('auth')` reads that were previously
 * duplicated across ModulesService/ScenarioService/etc - those reads still
 * work as a fallback, this just keeps the header in sync with the store).
 * On a 401 from a non-auth endpoint, it calls AuthService.refreshToken()
 * once, updates the store, and retries the original request with the new
 * token. If the refresh itself fails, the session is cleared and the user
 * is sent back to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const authService = inject(AuthService);
  const router = inject(Router);

  let token: string | undefined;
  store
    .select(selectToken)
    .pipe(take(1))
    .subscribe((value) => (token = value));

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized =
        error instanceof HttpErrorResponse && error.status === 401;

      if (!isUnauthorized || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((response) => {
          store.dispatch(
            AuthActions.refreshTokenSuccess({ token: response.token }),
          );

          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${response.token}` },
          });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          store.dispatch(
            AuthActions.refreshTokenFailure({ error: 'Session expired' }),
          );
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
