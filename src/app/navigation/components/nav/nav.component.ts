import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-nav',
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: true,
  host: {
    '[class.sidebar-hidden]': 'sidebarHidden',
  },
})
export class NavComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;
  sidebarHidden = false;
  profileOpen = false;
  private subscription: Subscription = new Subscription();

  bars = faBars;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      }),
    );
    this.subscription.add(
      this.authService.isAuthenticated$.subscribe((auth) => {
        this.isAuthenticated = auth;
      }),
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  toggleProfileMenu() {
    this.profileOpen = !this.profileOpen;
  }

  logout() {
    this.profileOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
