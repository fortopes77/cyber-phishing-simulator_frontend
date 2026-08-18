import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { User } from 'src/app/auth/auth.service';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

enum ActivityStatus {
  completed = 'completed',
  started = 'started',
  failed = 'failed',
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false,
})
export class AdminDashboardComponent {
  currentUser?: User;
  fontAwesomeIcons = iconLibrary;
  activities = [
    {
      userName: 'Joseph Smith',
      action: 'Completed Email Phishing Basics',
      timestamp: '2 hours ago',
      status: ActivityStatus.completed,
    },
    {
      userName: 'Josephina Smith',
      action: 'Started Email Phishing Basics',
      timestamp: '3 hours ago',
      status: ActivityStatus.started,
    },
    {
      userName: 'Joseph Smith',
      action: 'Failed SMS Phishing Basics',
      timestamp: '5 hours ago',
      status: ActivityStatus.failed,
    },
  ];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.subscribeToAuthUser();
  }

  subscribeToAuthUser(): void {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentUser = authState.user;
    });
  }

  viewDetails(): void {
    //TODO: Implement navigation to details page
  }
}
