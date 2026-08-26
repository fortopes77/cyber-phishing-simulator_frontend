import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthState } from './auth/+state/auth.selectors';
import { User } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'phishing-frontend';
  currentUser?: User;

  constructor(
    private router: Router,
    private store: Store,
  ) {}

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
