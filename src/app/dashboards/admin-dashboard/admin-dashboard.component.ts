import { Component } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    standalone: false
})
export class AdminDashboardComponent {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to current user
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }
}
