import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectAuthState } from './auth/+state/auth.selectors';
import { AuthService, User } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'phishing-frontend';
  currentUser?: User;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store,
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit() {
    this.subscribeToAuthUser();
  }

  subscribeToAuthUser() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentUser = authState.user;
    });
  }

  goToAdminDashboard(): void {
    this.router.navigate(['/trainer/dashboard']);
  }

  goToUserDashboard(): void {
    this.router.navigate(['/learner/dashboard']);
  }
}
