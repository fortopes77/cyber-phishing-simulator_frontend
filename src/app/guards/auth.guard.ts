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

        // 2. Role check (if required)
        const requiredRole = route.data['role'];

        if (requiredRole) {
          const userRole = auth?.user?.role;

          if (userRole !== requiredRole) {
            console.log(`Access denied - requires ${requiredRole} role`);

            this.router.navigate(['/learner/dashboard']);
            return false;
          }
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
}
