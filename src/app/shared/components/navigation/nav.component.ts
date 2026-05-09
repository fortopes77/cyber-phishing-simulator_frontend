import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectAuthState } from '../../../auth/+state/auth.selectors';
import { AuthService, User } from '../../../auth/auth.service';
import { iconLibrary } from '../../constants/font-awesome-icons.const';

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
  currentUser: User | undefined = undefined;
  isAuthenticated = false;
  sidebarHidden = false;
  profileOpen = false;
  fontAwesomeIcons = iconLibrary;

  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit() {
    this.subscribeToAuthState();
  }

  subscribeToAuthState() {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState?.isAuthenticated) {
        this.currentUser = authState.user;
      }
    });
  }

  triggerFeedback() {
    this.authService
      .getFeedback({
        scenario_content: 'Fake Microsoft password reset email',
        scenarioChoices: [
          {
            id: 1,
            text: 'Clicked the link',
            isCorrect: false,
            scenarioId: 1,
          },
          {
            id: 2,
            text: 'Reported the email',
            isCorrect: true,
            scenarioId: 1,
          },
        ],
        selectedChoiceId: 1,
      })
      .subscribe({
        next: (res) => {
          console.log(res);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  ngOnDestroy() {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  toggleProfileMenu() {
    this.profileOpen = !this.profileOpen;
  }

  logout() {
    this.profileOpen = false;
    this.router.navigate(['/sign-out']);
  }
}
