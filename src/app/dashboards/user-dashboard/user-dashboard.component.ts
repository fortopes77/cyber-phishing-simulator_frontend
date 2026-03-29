import { Component } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
})
export class UserDashboardComponent {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to current user
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }
}
