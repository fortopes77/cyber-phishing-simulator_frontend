import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
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
import { UsersActions } from 'src/app/users/+state/users.actions';

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

// ASSUMPTION: no learners/analytics endpoint exists yet - there's no Jira
// ticket covering it on the backend board at time of writing. This mock
// data stands in until a real "GET learners" (with per-learner progress,
// score and weakness breakdown) contract is available.
const FIRST_NAMES = [
  'Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Grace', 'Lucas', 'Ella',
  'Mason', 'Chloe', 'Owen', 'Ruby', 'Leo', 'Nina', 'Jack', 'Isla', 'Finn',
  'Maya', 'Sam',
];
const LAST_NAMES = [
  'Morales', 'Bennett', 'Chen', 'Patel', 'Okafor', 'Nguyen', 'Fischer',
  'Rossi', 'Kowalski', 'Silva', 'Andersson', 'Kim', 'Haddad', 'Novak',
  'Reyes',
];
const WEAKNESS_POOL = [
  'Urgency', 'Domain Mismatch', 'Spoofed Sender', 'Suspicious Link',
  'Grammar Errors', 'Attachment Risk', 'Generic Greeting',
];
const LAST_ACTIVE_POOL = [
  'Just now', '2 hours ago', 'Yesterday', '2 days ago', '3 days ago',
  '1 week ago',
];
// Parallel to LAST_ACTIVE_POOL - how many days before now each label
// represents, so the "Last Active" filter has a real Date to compare
// against instead of just the display string.
const LAST_ACTIVE_DAYS_AGO_POOL = [0, 0, 1, 2, 3, 7];
const TOTAL_MOCK_LEARNERS = 52;

@Component({
  selector: 'app-learner-list',
  imports: [
    CommonModule,
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
    this.rows = this.buildLearnerRows();
    this.filteredRows = this.rows;
    this.computeStats(this.filteredRows);

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

    const userId = String(this.selectedLearnerRow.id);
    this.store.dispatch(UsersActions.deleteUser({ userId }));
    // The learner table above is still generated mock data (see the
    // ASSUMPTION comment on buildLearnerRows) rather than store-backed, so
    // the row is removed here directly instead of waiting on a
    // deleteUserSuccess subscription - swap this for a store selector once
    // a real "GET learners" endpoint exists.
    this.rows = this.rows.filter((row) => row.id !== this.selectedLearnerRow!.id);
    this.applyLastActiveFilter();
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

  private buildLearnerRows(): LearnerRow[] {
    const rows: LearnerRow[] = [];

    for (let i = 0; i < TOTAL_MOCK_LEARNERS; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const weaknessCount = 1 + (i % 3);
      const weaknesses = Array.from(
        { length: weaknessCount },
        (_, w) => WEAKNESS_POOL[(i + w) % WEAKNESS_POOL.length],
      );

      const lastActiveIndex = i % LAST_ACTIVE_POOL.length;
      const lastActiveDate = new Date();
      lastActiveDate.setDate(
        lastActiveDate.getDate() - LAST_ACTIVE_DAYS_AGO_POOL[lastActiveIndex],
      );

      rows.push({
        id: i + 1,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        progress: (i * 7) % 101,
        avgScore: 40 + ((i * 11) % 61),
        lastActive: LAST_ACTIVE_POOL[lastActiveIndex],
        lastActiveDate,
        weaknesses,
      });
    }

    return rows;
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
