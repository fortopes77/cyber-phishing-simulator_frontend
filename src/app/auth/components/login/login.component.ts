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
      if (!authState) {
        this.isLoading = false;
        return;
      }

      this.isLoading = authState.loading;
      this.errorMessage = authState.error || '';

      if (!authState.isAuthenticated) {
        this.isLoading = false;
        this.errorMessage = authState.error || '';
        return;
      }

      if (authState.user?.role === 'trainer') {
        this.router.navigate(['/trainer/dashboard']);
      } else if (authState.user?.role) {
        this.router.navigate(['/learner/dashboard']);
      }
    });
  }

  async onLogin(): Promise<void> {
    // Clear previous error
    this.errorMessage = '';

    const credential = this.credential.trim();
    const password = this.password.trim();

    // Validate inputs
    if (!credential || !password) {
      this.errorMessage = 'Please enter both username/email and password';
      return;
    }

    this.isLoading = true;

    // Attempt login
    this.store.dispatch(
      AuthActions.login({
        credential,
        password,
      }),
    );
  }
}
