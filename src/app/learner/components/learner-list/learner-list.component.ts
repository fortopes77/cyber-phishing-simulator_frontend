import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { filter, map, take } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  HeaderComponent,
  HeaderCreateAction,
} from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';
import { ProgressRowComponent } from 'src/app/shared/components/progress-row/progress-row.component';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { ResetPasswordModalComponent } from 'src/app/shared/components/reset-password-modal/reset-password-modal.component';
import {
  DateRange,
  DateRangePickerComponent,
} from 'src/app/shared/components/date-range-picker/date-range-picker.component';
import {
  ListAction,
  ListCellTemplateDirective,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { getWeaknessLabel, UserAccount } from 'src/app/users/+state/user-account.model';

interface LearnerRow extends Record<string, unknown> {
  id: number;
  fullName: string;
  email: string;
  progress: number;
  avgScore: number;
  lastActive: string;
  lastActiveDate: Date;
  weaknesses: string[];
}

// Mirrors the "Just now / X hours ago / Yesterday / X days ago" style the
// UI previously showed with mock data, now derived from the real
// lastActiveAt timestamp GET /users/learners returns.
function formatLastActive(iso: string | null | undefined): string {
  if (!iso) {
    return 'Never';
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

@Component({
  selector: 'app-learner-list',
  imports: [
    CommonModule,
    RouterModule,
    FaIconComponent,
    HeaderComponent,
    DashboardCardComponent,
    DataCardComponent,
    StatusBadgeComponent,
    ProgressRowComponent,
    ListComponent,
    ListCellTemplateDirective,
    DeleteConfirmationModalComponent,
    ResetPasswordModalComponent,
    DateRangePickerComponent,
  ],
  templateUrl: './learner-list.component.html',
  styleUrl: './learner-list.component.scss',
})
export class LearnerListComponent implements OnInit {
  fontAwesomeIcon = iconLibrary;

  columns: ListColumn[] = [];
  rows: LearnerRow[] = [];
  filteredRows: LearnerRow[] = [];
  actions: ListAction[] = [];

  lastActiveRange: DateRange = { start: null, end: null };

  totalLearners = 0;
  highPerformers = 0;
  needsAttention = 0;
  averageCompletion = 0;

  createActions: HeaderCreateAction[] = [
    {
      label: 'Add Learner',
      action: () => this.handleCreate(),
    },
  ];

  isDeleteModalOpen = false;
  selectedLearnerName = '';
  selectedLearnerRow: LearnerRow | null = null;

  isResetPasswordModalOpen = false;
  selectedResetPasswordRow: LearnerRow | null = null;
  selectedResetPasswordUserName = '';
  resetPasswordLoading = false;
  resetPasswordError: string | null = null;

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly actions$: Actions,
  ) {}

  ngOnInit(): void {
    this.subscribeToResetPasswordResult();
    this.subscribeToLearnerList();
    this.fetchLearners();

    this.columns = [
      { key: 'learner', label: 'Learner', sortable: true },
      { key: 'progress', label: 'Progress', sortable: true },
      { key: 'avgScore', label: 'Avg Score', sortable: true },
      { key: 'lastActive', label: 'Last Active', sortable: false },
      { key: 'weaknesses', label: 'Weaknesses', sortable: false },
    ];

    this.actions = [
      {
        label: 'Edit',
        action: (row) => this.handleEdit(row),
        icon: iconLibrary.penIcon,
        tooltip: 'Edit learner',
      },
      {
        label: 'Delete',
        action: (row) => this.handleDelete(row),
        icon: iconLibrary.trashIcon,
        tooltip: 'Delete learner',
      },
      {
        label: 'Reset Password',
        action: (row) => this.handleResetPassword(row),
        icon: iconLibrary.keyIcon,
        tooltip: 'Reset password',
      },
    ];
  }

  // GET /users/learners is scoped to one organisation - read it off the
  // signed-in trainer's own account rather than hard-coding it.
  private fetchLearners(): void {
    this.store
      .select(selectAuthState)
      .pipe(
        map((auth) => auth.user?.organisationId),
        filter((organisationId): organisationId is number => organisationId != null),
        take(1),
      )
      .subscribe((organisationId) => {
        this.store.dispatch(UsersActions.fetchList({ organisationId }));
      });
  }

  // Reacts to the store's learner list rather than mutating `rows` locally,
  // so a delete/create/edit is reflected here as soon as the reducer
  // applies it - no manual splicing needed (see confirmDelete).
  private subscribeToLearnerList(): void {
    this.store.select(selectUserList).subscribe((users) => {
      this.rows = this.buildLearnerRows(users);
      this.applyLastActiveFilter();
    });
  }

  private handleCreate(): void {
    this.router.navigate(['/trainer/learners/create']);
  }

  private handleEdit(row: Record<string, unknown>): void {
    this.router.navigate(['/trainer/learners', String(row['id']), 'edit']);
  }

  private handleDelete(row: Record<string, unknown>): void {
    this.selectedLearnerRow = row as LearnerRow;
    this.selectedLearnerName = String(row['fullName'] ?? 'this learner');
    this.isDeleteModalOpen = true;
  }

  private handleResetPassword(row: Record<string, unknown>): void {
    this.selectedResetPasswordRow = row as LearnerRow;
    this.selectedResetPasswordUserName = String(row['fullName'] ?? 'this user');
    this.resetPasswordError = null;
    this.isResetPasswordModalOpen = true;
  }

  confirmResetPassword(payload: { newPassword: string }): void {
    if (!this.selectedResetPasswordRow) {
      return;
    }

    this.resetPasswordLoading = true;
    this.store.dispatch(
      UsersActions.resetUserPassword({
        userId: String(this.selectedResetPasswordRow.id),
        newPassword: payload.newPassword,
      }),
    );
  }

  cancelResetPassword(): void {
    this.isResetPasswordModalOpen = false;
    this.selectedResetPasswordRow = null;
    this.selectedResetPasswordUserName = '';
    this.resetPasswordError = null;
  }

  private subscribeToResetPasswordResult(): void {
    this.actions$
      .pipe(ofType(UsersActions.resetUserPasswordSuccess))
      .subscribe(() => {
        this.resetPasswordLoading = false;
        this.isResetPasswordModalOpen = false;
        this.selectedResetPasswordRow = null;
        this.selectedResetPasswordUserName = '';
      });

    this.actions$
      .pipe(ofType(UsersActions.resetUserPasswordFailure))
      .subscribe(({ error }) => {
        this.resetPasswordLoading = false;
        this.resetPasswordError = error;
      });
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = false;
    if (!this.selectedLearnerRow) {
      return;
    }

    // No manual row removal needed - users.reducer already drops the
    // deleted id from userList on deleteUserSuccess, which flows back here
    // through subscribeToLearnerList.
    this.store.dispatch(
      UsersActions.deleteUser({ userId: String(this.selectedLearnerRow.id) }),
    );
    this.selectedLearnerRow = null;
    this.selectedLearnerName = '';
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedLearnerRow = null;
    this.selectedLearnerName = '';
  }

  scoreVariant(score: number): 'success' | 'warning' | 'danger' {
    if (score >= 80) {
      return 'success';
    }
    return score >= 60 ? 'warning' : 'danger';
  }

  visibleWeaknesses(row: LearnerRow): string[] {
    return row.weaknesses.slice(0, 2);
  }

  overflowWeaknessCount(row: LearnerRow): number {
    return Math.max(0, row.weaknesses.length - 2);
  }

  onLastActiveRangeChange(range: DateRange): void {
    this.lastActiveRange = range;
    this.applyLastActiveFilter();
  }

  private applyLastActiveFilter(): void {
    const { start, end } = this.lastActiveRange;

    this.filteredRows = this.rows.filter((row) => {
      if (!start && !end) {
        return true;
      }

      const time = row.lastActiveDate.getTime();
      if (start && time < start.getTime()) {
        return false;
      }
      if (end && time > end.getTime()) {
        return false;
      }
      return true;
    });

    this.computeStats(this.filteredRows);
  }

  // All fields, including progress/score/last-active/weaknesses, now come
  // straight from GET /users/learners (LearnerResponseDto) - nothing here
  // is mocked.
  private buildLearnerRows(users: UserAccount[]): LearnerRow[] {
    return users.map((user) => {
      const lastActiveAt = user.lastActiveAt ?? null;

      return {
        id: Number(user.id),
        fullName: user.fullName,
        email: user.email,
        progress: user.progressPercentage ?? 0,
        avgScore: user.averageScore ?? 0,
        lastActive: formatLastActive(lastActiveAt),
        lastActiveDate: lastActiveAt ? new Date(lastActiveAt) : new Date(0),
        weaknesses: (user.weaknesses ?? []).map(getWeaknessLabel),
      };
    });
  }

  private computeStats(rows: LearnerRow[]): void {
    this.totalLearners = rows.length;
    this.highPerformers = rows.filter((row) => row.avgScore >= 85).length;
    this.needsAttention = rows.filter((row) => row.avgScore < 60).length;
    this.averageCompletion = rows.length
      ? Math.round(
          rows.reduce((sum, row) => sum + row.progress, 0) / rows.length,
        )
      : 0;
  }
}
