import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    // Check if user is authenticated
    if (!this.authService.hasValidToken()) {
      console.log('Access denied - not authenticated. Redirecting to login.');
      this.router.navigate(['/login']);
      return false;
    }

    // Check if route requires specific role
    if (route.data['role']) {
      const requiredRole = route.data['role'];
      if (!this.authService.hasRole(requiredRole)) {
        console.log(
          `Access denied - requires ${requiredRole} role. Redirecting to dashboard.`,
        );
        this.router.navigate(['/user-dashboard']);
        return false;
      }
    }

    return true;
  }
}
