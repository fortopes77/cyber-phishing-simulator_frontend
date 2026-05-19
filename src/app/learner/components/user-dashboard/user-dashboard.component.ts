import { Component } from '@angular/core';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { AuthService, User } from '../../../auth/auth.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { LearningProgress } from '../../models/learning-progress.model';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  standalone: false,
})
export class UserDashboardComponent {
  currentUser?: User;
  fontAwesomeIcon = iconLibrary;
  continueLearning: LearningProgress = {
    id: '1',
    title: 'Email Phishing Basics',
    level: 'Beginner',
    completedScenarios: 1,
    totalScenarios: 2,
    progressPercentage: 50,
    icon: 'schedule',
    route: '/learning/email-phishing',
  };
  constructor(private store: Store) {}

  ngOnInit() {
    this.subscribeToAuthUser();
  }

  subscribeToAuthUser() {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState?.isAuthenticated) {
        this.currentUser = authState.user;
      }
    });
  }
}
