import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { combineLatest } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  HeaderComponent,
  HeaderCreateAction,
} from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { ForgotPasswordModalComponent } from 'src/app/shared/components/forgot-password-modal/forgot-password-modal.component';
import {
  ListAction,
  ListCellTemplateDirective,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { OrganisationFilterComponent } from 'src/app/organisations/components/organisation-filter/organisation-filter.component';
import { organisationScopeChanges } from 'src/app/organisations/+state/organisation-scope';
import {
  selectIsGlobalAdmin,
  selectOrganisationNames,
} from 'src/app/organisations/+state/organisations.selectors';
import { AuthActions } from 'src/app/auth/+state/auth.actions';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectTrainerList } from 'src/app/users/+state/users.selectors';
import { UserAccount } from 'src/app/users/+state/user-account.model';

interface TrainerRow extends Record<string, unknown> {
  id: number;
  fullName: string;
  email: string;
  // Only shown to global admins, who can see trainers from every organisation.
  organisationName: string | null;
}

// Trainers can only be created or deleted from here - not edited. A trainer
// is responsible for updating their own name/email (via the profile modal),
// and their password can only be set directly at creation; after that, the
// only way to change it is the "send password reset email" flow below. This
// mirrors LearnerListComponent's shape but deliberately has no Edit action
// and no direct "set new password" modal.
@Component({
  selector: 'app-trainer-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FaIconComponent,
    HeaderComponent,
    DashboardCardComponent,
    ListComponent,
    ListCellTemplateDirective,
    DeleteConfirmationModalComponent,
    ForgotPasswordModalComponent,
    OrganisationFilterComponent,
  ],
  templateUrl: './trainer-list.component.html',
  styleUrl: './trainer-list.component.scss',
})
export class TrainerListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  fontAwesomeIcon = iconLibrary;
  isGlobalAdmin = false;

  columns: ListColumn[] = [];
  rows: TrainerRow[] = [];
  actions: ListAction[] = [];

  createActions: HeaderCreateAction[] = [
    {
      label: 'Add Trainer',
      action: () => this.handleCreate(),
    },
  ];

  isDeleteModalOpen = false;
  selectedTrainerName = '';
  selectedTrainerRow: TrainerRow | null = null;

  isForgotPasswordModalOpen = false;
  selectedResetRow: TrainerRow | null = null;
  selectedResetName = '';
  forgotPasswordSending = false;
  forgotPasswordError: string | null = null;

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly actions$: Actions,
  ) {}

  ngOnInit(): void {
    this.subscribeToForgotPasswordResult();
    this.subscribeToTrainerList();
    this.fetchTrainers();

    this.columns = [{ key: 'trainer', label: 'Trainer', sortable: true }];

    this.actions = [
      {
        label: 'Send Password Reset Email',
        action: (row) => this.handleForgotPassword(row),
        icon: iconLibrary.keyIcon,
        tooltip: 'Send password reset email',
      },
      {
        label: 'Delete',
        action: (row) => this.handleDelete(row),
        icon: iconLibrary.trashIcon,
        tooltip: 'Delete trainer',
      },
    ];
  }

  // Scoped like LearnerListComponent.fetchLearners - own organisation for a
  // trainer, the organisation filter's choice (or all) for a global admin.
  private fetchTrainers(): void {
    organisationScopeChanges(this.store)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ organisationId }) => {
        this.store.dispatch(UsersActions.fetchTrainerList({ organisationId }));
      });
  }

  private subscribeToTrainerList(): void {
    combineLatest([
      this.store.select(selectTrainerList),
      this.store.select(selectOrganisationNames),
      this.store.select(selectIsGlobalAdmin),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([users, organisationNames, isGlobalAdmin]) => {
        this.isGlobalAdmin = isGlobalAdmin;
        this.rows = this.buildTrainerRows(users, organisationNames);
      });
  }

  private buildTrainerRows(
    users: UserAccount[],
    organisationNames: Map<number, string>,
  ): TrainerRow[] {
    return users.map((user) => ({
      id: Number(user.id),
      fullName: user.fullName,
      email: user.email,
      organisationName:
        user.organisationId != null
          ? (organisationNames.get(user.organisationId) ?? null)
          : null,
    }));
  }

  private handleCreate(): void {
    this.router.navigate(['/trainer/trainers/create']);
  }

  private handleDelete(row: Record<string, unknown>): void {
    this.selectedTrainerRow = row as TrainerRow;
    this.selectedTrainerName = String(row['fullName'] ?? 'this trainer');
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = false;
    if (!this.selectedTrainerRow) {
      return;
    }

    // No manual row removal needed - users.reducer already drops the
    // deleted id from trainerList on deleteUserSuccess.
    this.store.dispatch(
      UsersActions.deleteUser({ userId: String(this.selectedTrainerRow.id) }),
    );
    this.selectedTrainerRow = null;
    this.selectedTrainerName = '';
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedTrainerRow = null;
    this.selectedTrainerName = '';
  }

  private handleForgotPassword(row: Record<string, unknown>): void {
    this.selectedResetRow = row as TrainerRow;
    this.selectedResetName = String(row['fullName'] ?? 'this trainer');
    this.forgotPasswordError = null;
    this.isForgotPasswordModalOpen = true;
  }

  confirmForgotPassword(): void {
    if (!this.selectedResetRow) {
      return;
    }

    this.forgotPasswordSending = true;
    this.store.dispatch(
      AuthActions.forgotPassword({ email: this.selectedResetRow.email }),
    );
  }

  cancelForgotPassword(): void {
    this.isForgotPasswordModalOpen = false;
    this.selectedResetRow = null;
    this.selectedResetName = '';
    this.forgotPasswordError = null;
  }

  private subscribeToForgotPasswordResult(): void {
    this.actions$
      .pipe(ofType(AuthActions.forgotPasswordSuccess))
      .subscribe(() => {
        this.forgotPasswordSending = false;
        this.isForgotPasswordModalOpen = false;
        this.selectedResetRow = null;
        this.selectedResetName = '';
      });

    this.actions$
      .pipe(ofType(AuthActions.forgotPasswordFailure))
      .subscribe(({ error }) => {
        this.forgotPasswordSending = false;
        this.forgotPasswordError = error;
      });
  }
}
