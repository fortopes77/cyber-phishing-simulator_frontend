import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { AuthActions } from '../../+state/auth.actions';
import { Store } from '@ngrx/store';
import { selectAuthState } from '../../+state/auth.selectors';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
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
    private store: Store,
  ) {}

  ngOnInit() {
    this.subscribeToLoginSuccess();
  }

  subscribeToLoginSuccess() {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState?.isAuthenticated) {
        this.isLoading = false;
      }
      if (authState?.user?.role === 'admin') {
        this.router.navigate(['/trainer/dashboard']);
      } else {
        this.router.navigate(['/learner/dashboard']);
      }
    });
  }

  async onLogin(): Promise<void> {
    // Clear previous error
    this.errorMessage = '';

    // Validate inputs
    if (!this.credential.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username/email and password';
      return;
    }

    this.isLoading = true;

    // Attempt login
    this.store.dispatch(
      AuthActions.login({
        credential: this.credential,
        password: this.password,
      }),
    );
  }
}
