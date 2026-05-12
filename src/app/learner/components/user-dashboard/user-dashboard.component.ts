import { Component } from '@angular/core';
import { AuthService, User } from '../../../auth/auth.service';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  standalone: false,
})
export class UserDashboardComponent {
  currentUser: User | null = null;
  fontAwesomeIcon = iconLibrary;
  constructor() {}
}
