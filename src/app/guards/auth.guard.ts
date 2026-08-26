import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { map, switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectAuthState } from '../auth/+state/auth.selectors';
import { AuthActions } from '../auth/+state/auth.actions';
import { isTokenExpired } from '../auth/token.utils';

/**
 * Where each role gets sent when it is turned away from a route it is not
 * allowed to see. Keyed by the lowercase role values normalizeUser() produces.
 */
const ROLE_HOME: Record<string, string> = {
  trainer: '/trainer/dashboard',
  user: '/learner/dashboard',
};

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router,
    private actions$: Actions,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.store.select(selectAuthState).pipe(
      take(1),
      switchMap((auth) => {
        // 1. Not logged in
        if (!auth?.isAuthenticated && !auth?.token) {
          console.log('Access denied - not authenticated');
          this.router.navigate(['/login']);
          return of(false);
        }

        // 2. Role check. Routes declare either `roles: ['a', 'b']` for a set
        // of allowed roles or `role: 'a'` for a single one; a route with
        // neither is open to any authenticated user.
        const userRole = auth?.user?.role;
        const allowedRoles = this.allowedRoles(route);

        if (allowedRoles.length && !allowedRoles.includes(userRole ?? '')) {
          console.log(
            `Access denied - requires one of [${allowedRoles.join(', ')}] role`,
          );

          // Send them to their own landing page rather than a fixed one, so a
          // trainer bounced off a learner-only route does not get redirected
          // straight back into another route they are not allowed to see.
          this.router.navigate([this.homeFor(userRole)]);
          return of(false);
        }

        // 3. Token expiry. Auth state lives only in the NgRx store now (no
        // localStorage persistence), so an expired token here means the
        // session genuinely needs refreshing before this navigation can be
        // trusted - dispatch the refresh and wait for its outcome rather
        // than optimistically letting the route through. A failed refresh
        // clears the session (auth.reducer) and is redirected to /login by
        // AuthEffects.refreshTokenFailureRedirect$, so this guard only
        // needs to report the resulting canActivate decision.
        if (!isTokenExpired(auth.tokenExpiresAt)) {
          return of(true);
        }

        console.log('Token expired - requesting a refresh');
        this.store.dispatch(AuthActions.refreshToken({ token: auth.token }));

        return this.actions$.pipe(
          ofType(
            AuthActions.refreshTokenSuccess,
            AuthActions.refreshTokenFailure,
          ),
          take(1),
          map((action) => action.type === AuthActions.refreshTokenSuccess.type),
        );
      }),
    );
  }

  /** Normalises the `roles`/`role` route data into a single list. */
  private allowedRoles(route: ActivatedRouteSnapshot): string[] {
    const roles = route.data?.['roles'];
    const role = route.data?.['role'];

    if (Array.isArray(roles)) {
      return roles;
    }

    return role ? [role] : [];
  }

  /**
   * An unrecognised (or missing) role has nowhere safe to land, so it goes
   * back to login instead of into a redirect loop.
   */
  private homeFor(role: string | undefined): string {
    return (role && ROLE_HOME[role]) || '/login';
  }
}
