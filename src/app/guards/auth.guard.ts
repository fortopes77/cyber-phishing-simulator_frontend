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

        return true;
      }),
    );
  }
}
