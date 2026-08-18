import { Component, AfterViewInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../+state/auth.actions';

@Component({
  selector: 'app-sign-out',
  imports: [RouterModule],
  templateUrl: './sign-out.component.html',
  styleUrl: './sign-out.component.scss',
  standalone: true,
})
export class SignOutComponent implements AfterViewInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store,
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.store.dispatch(AuthActions.logout());
    }, 0);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
