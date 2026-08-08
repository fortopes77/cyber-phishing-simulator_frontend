import { Component } from '@angular/core';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { AuthService, User } from '../../../auth/auth.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { LearningProgress } from '../../models/learning-progress.model';

interface AssignedModule {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  scenarios: number;
  status: string;
  progressPercentage: number;
  route?: string;
}

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
    route: '/learner/modules/email-phishing',
  };

  assignedModules: AssignedModule[] = [
    {
      id: 'module-1',
      title: 'Email Phishing Basics',
      description:
        'Learn to identify common email phishing tactics and protect yourself from credential theft.',
      level: 'Beginner',
      scenarios: 3,
      status: 'In progress',
      progressPercentage: 78,
      route: '/learner/modules/email-phishing',
    },
    {
      id: 'module-2',
      title: 'Social Engineering Awareness',
      description:
        'Understand how attackers manipulate human behavior to gain access or information.',
      level: 'Beginner',
      scenarios: 3,
      status: 'Assigned',
      progressPercentage: 22,
      route: '/learner/modules/social-engineering',
    },
    {
      id: 'module-3',
      title: 'Credential Safety',
      description:
        'Review best practices for creating secure passwords and protecting account access.',
      level: 'Beginner',
      scenarios: 3,
      status: 'Assigned',
      progressPercentage: 10,
      route: '/learner/modules/credential-safety',
    },
    {
      id: 'module-4',
      title: 'Suspicious Link Recognition',
      description:
        'Spot malicious links and attachments before they can compromise your devices.',
      level: 'Beginner',
      scenarios: 3,
      status: 'Assigned',
      progressPercentage: 0,
      route: '/learner/modules/link-recognition',
    },
  ];

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

  onAssignedModuleSelected(module: AssignedModule): void {
    console.log('Assigned module selected:', module.title);
  }
}
