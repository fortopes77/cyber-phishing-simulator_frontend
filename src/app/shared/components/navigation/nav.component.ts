
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription } from 'rxjs';
import { AuthActions } from '../../../auth/+state/auth.actions';
import { selectAuthState } from '../../../auth/+state/auth.selectors';
import { isStaffRole, User } from '../../../auth/auth.service';
import { iconLibrary } from '../../constants/font-awesome-icons.const';
import { SignOutConfirmationModalComponent } from '../sign-out-confirmation-modal/sign-out-confirmation-modal.component';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-nav',
  imports: [
    RouterModule,
    FaIconComponent,
    SignOutConfirmationModalComponent,
    ProfileModalComponent,
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: true,
  host: {
    '[class.sidebar-hidden]': 'sidebarHidden',
  },
})
export class NavComponent implements OnInit, OnDestroy {
  currentUser?: User;
  isAuthenticated = false;
  sidebarHidden = false;
  signOutModalOpen = false;
  fontAwesomeIcons = iconLibrary;

  profileModalOpen = false;
  profileSaving = false;
  profileError: string | null = null;
  profileSaved = false;
  passwordSaving = false;
  passwordError: string | null = null;
  passwordSaved = false;

  constructor(
    private router: Router,
    private store: Store,
    private actions$: Actions,
  ) {}

  ngOnInit() {
    this.subscribeToAuthUser();
    this.subscribeToProfileUpdateResult();
    this.subscribeToPasswordChangeResult();
  }

  subscribeToAuthUser() {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState?.isAuthenticated) {
        this.currentUser = authState.user;
      }
    });
  }

  get isStaff(): boolean {
    return isStaffRole(this.currentUser?.role);
  }

  get fullName(): string | undefined {
    const name = [this.currentUser?.firstName, this.currentUser?.lastName]
      .filter(Boolean)
      .join(' ');
    return name || this.currentUser?.username;
  }

  ngOnDestroy() {}

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  openProfileModal(): void {
    this.profileModalOpen = true;
    this.profileError = null;
    this.profileSaved = false;
    this.passwordError = null;
    this.passwordSaved = false;
  }

  closeProfileModal(): void {
    this.profileModalOpen = false;
  }

  saveProfile(payload: { firstName: string; lastName: string; email: string }): void {
    if (!this.currentUser) {
      return;
    }

    this.profileSaving = true;
    this.profileSaved = false;
    this.store.dispatch(
      AuthActions.updateProfile({ userId: this.currentUser.id, ...payload }),
    );
  }

  savePassword(payload: { newPassword: string }): void {
    if (!this.currentUser) {
      return;
    }

    this.passwordSaving = true;
    this.passwordSaved = false;
    this.store.dispatch(
      AuthActions.changePassword({ userId: this.currentUser.id, ...payload }),
    );
  }

  private subscribeToProfileUpdateResult(): void {
    this.actions$.pipe(ofType(AuthActions.updateProfileSuccess)).subscribe(() => {
      this.profileSaving = false;
      this.profileError = null;
      this.profileSaved = true;
    });

    this.actions$.pipe(ofType(AuthActions.updateProfileFailure)).subscribe(({ error }) => {
      this.profileSaving = false;
      this.profileError = error;
    });
  }

  private subscribeToPasswordChangeResult(): void {
    this.actions$.pipe(ofType(AuthActions.changePasswordSuccess)).subscribe(() => {
      this.passwordSaving = false;
      this.passwordError = null;
      this.passwordSaved = true;
    });

    this.actions$.pipe(ofType(AuthActions.changePasswordFailure)).subscribe(({ error }) => {
      this.passwordSaving = false;
      this.passwordError = error;
    });
  }

  logout() {
    this.signOutModalOpen = true;
  }

  confirmSignOut() {
    this.signOutModalOpen = false;
    this.router.navigate(['/sign-out']);
  }

  cancelSignOut() {
    this.signOutModalOpen = false;
  }
}
