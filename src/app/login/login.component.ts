import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  credential: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  // Mock credentials info for users
  mockCredentials = {
    admin: { credential: 'admin@example.com or admin', password: 'admin' },
    user: { credential: 'user@example.com or user', password: 'user' },
  };

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onLogin(): void {
    // Clear previous error
    this.errorMessage = '';

    // Validate inputs
    if (!this.credential.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username/email and password';
      return;
    }

    this.isLoading = true;

    // Attempt login
    if (this.authService.login(this.credential.trim(), this.password.trim())) {
      // Login successful - redirect to appropriate dashboard
      const user = this.authService.getCurrentUser();
      if (user?.role === 'admin') {
        this.router.navigate(['/trainer/dashboard']);
      } else {
        this.router.navigate(['/learner/dashboard']);
      }
    } else {
      // Login failed
      this.errorMessage = 'Invalid username/email or password';
      this.isLoading = false;
    }
  }
}
