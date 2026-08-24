import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
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
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.store.select(selectAuthState).pipe(
      take(1),
      map((auth) => {
        // 1. Not logged in
        if (!auth?.isAuthenticated && !auth?.token) {
          console.log('Access denied - not authenticated');
          this.router.navigate(['/login']);
          return false;
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
          return false;
        }

        // 3. Token expiry (matters most right after a page refresh, since
        // the meta.reducer rehydrates the auth slice - including a
        // possibly stale token - straight from localStorage). Let the
        // navigation through optimistically and kick off a refresh in the
        // background; the auth HTTP interceptor will also catch and
        // refresh on any 401 the stale token causes in the meantime.
        if (isTokenExpired(auth.tokenExpiresAt)) {
          console.log('Token expired - requesting a refresh');
          this.store.dispatch(AuthActions.refreshToken());
        }

        return true;
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
