import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'phishing-frontend';
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToAdminDashboard(): void {
    this.router.navigate(['/trainer/dashboard']);
  }

  goToUserDashboard(): void {
    this.router.navigate(['/learner/dashboard']);
  }
}
