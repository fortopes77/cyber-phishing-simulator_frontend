import { Component, AfterViewInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-sign-out',
  imports: [RouterModule],
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.scss'],
  standalone: true,
})
export class SignOutComponent implements AfterViewInit {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.authService.logout();
    }, 0);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
