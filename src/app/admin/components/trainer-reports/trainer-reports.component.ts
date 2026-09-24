import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { ProgressRowComponent } from 'src/app/shared/components/progress-row/progress-row.component';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';
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
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { getWeaknessLabel, UserAccount } from 'src/app/users/+state/user-account.model';
import { OrganisationFilterComponent } from 'src/app/organisations/components/organisation-filter/organisation-filter.component';
import { organisationScopeChanges } from 'src/app/organisations/+state/organisation-scope';
import { PASSING_SCORE } from 'src/app/module-results/+state/module-result.model';
import { DashboardActions } from '../../+state/dashboard.actions';
import { selectDashboardStats } from '../../+state/dashboard.selectors';
import { ReportsActions } from '../../+state/reports.actions';
import {
  selectLearnerReportDetail,
  selectLearnerReportRows,
  selectLearnerReportsLoading,
  selectModuleReportDetail,
  selectModuleReportRows,
  selectReportOverview,
  selectReportsError,
  selectReportsLoading,
} from '../../+state/reports.selectors';
import {
  LearnerReportDetail,
  LearnerReportStatus,
  ModuleReportDetail,
  ReportDateRange,
  ReportOverview,
  toReportDateRange,
} from '../../+state/reports.model';
import { ReportsService } from '../../+state/reports.service';
import { ActivityItem } from '../models/activity-item.model';
import { ActivityListComponent } from '../activity-list/activity-list.component';

interface CategoryBreakdown {
  category: string;
  label: string;
  learnerCount: number;
  percentage: number;
}

const TOP_CATEGORY_COUNT = 6;

export const LEARNER_STATUS_OPTIONS: { value: LearnerReportStatus | ''; label: string }[] = [
  { value: '', label: 'All learners' },
  { value: 'notStarted', label: 'Not started' },
  { value: 'inProgress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_LABELS: Record<LearnerReportStatus, string> = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: 'Completed',
};

/**
 * Trainer-facing reporting screen, built on the reporting endpoints
 * (GET /organisations/{orgId}/reports/...): headline numbers, per-module
 * completion/score/pass rates with a per-module breakdown, and per-learner
 * results with at-risk flags and a per-learner drill-down - all filtered by
 * an optional date range. Weakest categories (from GET /users/learners) and
 * recent activity (the trainer dashboard's activity feed) aren't covered by
 * the reporting endpoints, so still come from those.
 */
@Component({
  selector: 'app-trainer-reports',
  imports: [
    HeaderComponent,
    DashboardCardComponent,
    DataCardComponent,
    ProgressRowComponent,
    StatusBadgeComponent,
    DateRangePickerComponent,
    ListComponent,
    ListCellTemplateDirective,
    ActivityListComponent,
    OrganisationFilterComponent,
  ],
  templateUrl: './trainer-reports.component.html',
  styleUrl: './trainer-reports.component.scss',
})
export class TrainerReportsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly reportsService = inject(ReportsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fontAwesomeIcons = iconLibrary;
  readonly statusOptions = LEARNER_STATUS_OPTIONS;

  overview: ReportOverview | null = null;
  loading = false;
  learnersLoading = false;
  error: string | null = null;

  dateRange: DateRange = { start: null, end: null };
  learnerStatus: LearnerReportStatus | null = null;

  readonly moduleColumns: ListColumn[] = [
    { key: 'title', label: 'Module', sortable: true },
    { key: 'completionRate', label: 'Completion', sortable: true },
    { key: 'averageScore', label: 'Avg Score', sortable: true },
    { key: 'passRate', label: 'Pass Rate', sortable: true },
  ];
  moduleRows: Record<string, unknown>[] = [];
  readonly moduleActions: ListAction[] = [
    {
      label: 'View Breakdown',
      action: (row) => this.viewModule(Number(row['moduleId'])),
      icon: iconLibrary.chartColumnIcon,
      tooltip: 'Score distribution and status breakdown',
    },
  ];

  readonly learnerColumns: ListColumn[] = [
    { key: 'name', label: 'Learner', sortable: true },
    { key: 'completionRate', label: 'Completion', sortable: true },
    { key: 'averageScore', label: 'Avg Score', sortable: true },
    { key: 'atRisk', label: 'At Risk' },
  ];
  learnerRows: Record<string, unknown>[] = [];
  readonly learnerActions: ListAction[] = [
    {
      label: 'View Modules',
      action: (row) => this.viewLearner(Number(row['userId'])),
      icon: iconLibrary.userIcon,
      tooltip: "This learner's score and status per module",
    },
  ];

  selectedModuleId: number | null = null;
  moduleDetail: ModuleReportDetail | null = null;
  selectedLearnerId: number | null = null;
  learnerDetail: LearnerReportDetail | null = null;

  categoryBreakdown: CategoryBreakdown[] = [];
  recentActivity: ActivityItem[] = [];

  // A global admin with "All organisations" selected - these endpoints only
  // report on one organisation at a time.
  needsOrganisation = false;
  private organisationId: number | null = null;
  // Re-fetches whenever the date range or learner filter changes.
  private readonly filters$ = new BehaviorSubject<void>(undefined);
  private learnerNames = new Map<number, string>();

  ngOnInit(): void {
    this.subscribeToReport();
    this.subscribeToExtras();

    combineLatest([organisationScopeChanges(this.store), this.filters$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([{ isGlobalAdmin, organisationId }]) => {
        this.needsOrganisation = isGlobalAdmin && organisationId == null;
        this.organisationId = organisationId;
        if (organisationId == null) {
          return;
        }
        this.fetchReport(organisationId);
      });
  }

  private get range(): ReportDateRange {
    return toReportDateRange(this.dateRange.start, this.dateRange.end);
  }

  private fetchReport(organisationId: number): void {
    const range = this.range;
    this.closeDetails();
    this.store.dispatch(ReportsActions.fetchReport({ organisationId, range }));
    this.store.dispatch(
      ReportsActions.fetchLearners({ organisationId, range, status: this.learnerStatus }),
    );
    // Learner names and weakness categories, plus the recent activity feed.
    this.store.dispatch(UsersActions.fetchList({ organisationId }));
    this.store.dispatch(DashboardActions.fetchTrainerDashboard());
  }

  private subscribeToReport(): void {
    this.store.select(selectReportOverview).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((overview) => {
      this.overview = overview;
    });
    this.store.select(selectModuleReportRows).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((modules) => {
      this.moduleRows = modules.map((row) => ({ ...row }));
    });
    combineLatest([
      this.store.select(selectLearnerReportRows),
      this.store.select(selectUserList),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([learners, users]) => {
        this.learnerNames = new Map(
          (users ?? []).map((user) => [Number(user.id), user.fullName || user.username]),
        );
        this.learnerRows = learners.map((row) => ({
          ...row,
          name: this.learnerName(row.userId, row.username),
        }));
      });
    this.store.select(selectModuleReportDetail).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((detail) => {
      this.moduleDetail = detail;
    });
    this.store.select(selectLearnerReportDetail).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((detail) => {
      this.learnerDetail = detail;
    });
    this.store.select(selectReportsLoading).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => {
      this.loading = loading;
    });
    this.store.select(selectLearnerReportsLoading).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => {
      this.learnersLoading = loading;
    });
    this.store.select(selectReportsError).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      this.error = error;
    });
  }

  // Not covered by the reporting endpoints - see the class comment.
  private subscribeToExtras(): void {
    this.store.select(selectUserList).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((learners) => {
      this.categoryBreakdown = this.buildCategoryBreakdown(learners ?? []);
    });
    this.store.select(selectDashboardStats).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stats) => {
      this.recentActivity = stats?.recentActivity ?? [];
    });
  }

  onDateRangeChange(range: DateRange): void {
    this.dateRange = range;
    this.filters$.next();
  }

  onLearnerStatusChange(value: string): void {
    this.learnerStatus = (value || null) as LearnerReportStatus | null;
    if (this.organisationId == null) {
      return;
    }
    this.selectedLearnerId = null;
    this.store.dispatch(
      ReportsActions.fetchLearners({
        organisationId: this.organisationId,
        range: this.range,
        status: this.learnerStatus,
      }),
    );
  }

  viewModule(moduleId: number): void {
    if (this.organisationId == null) {
      return;
    }
    this.selectedModuleId = moduleId;
    this.store.dispatch(
      ReportsActions.fetchModuleDetail({
        organisationId: this.organisationId,
        moduleId,
        range: this.range,
      }),
    );
  }

  viewLearner(userId: number): void {
    if (this.organisationId == null) {
      return;
    }
    this.selectedLearnerId = userId;
    this.store.dispatch(
      ReportsActions.fetchLearnerDetail({ organisationId: this.organisationId, userId }),
    );
  }

  closeDetails(): void {
    this.selectedModuleId = null;
    this.selectedLearnerId = null;
    this.store.dispatch(ReportsActions.clearDetails());
  }

  learnerName(userId: number, username = ''): string {
    return this.learnerNames.get(userId) || username;
  }

  get selectedModuleTitle(): string {
    return (
      (this.moduleRows.find((row) => row['moduleId'] === this.selectedModuleId)?.[
        'title'
      ] as string) ?? ''
    );
  }

  get moduleLearnerTotal(): number {
    const breakdown = this.moduleDetail?.statusBreakdown;
    return breakdown ? breakdown.notStarted + breakdown.inProgress + breakdown.completed : 0;
  }

  get scoredLearnerTotal(): number {
    return (this.moduleDetail?.scoreDistribution ?? []).reduce(
      (sum, bucket) => sum + bucket.count,
      0,
    );
  }

  statusLabel(status: LearnerReportStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusVariant(status: LearnerReportStatus): 'success' | 'info' | 'neutral' {
    return status === 'completed' ? 'success' : status === 'inProgress' ? 'info' : 'neutral';
  }

  scoreColor(percentage: number): string {
    return percentage >= PASSING_SCORE ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626';
  }

  // Counts how many learners carry each weakness category, so a trainer can
  // see which threats their organisation as a whole struggles with.
  private buildCategoryBreakdown(learners: UserAccount[]): CategoryBreakdown[] {
    const counts = new Map<string, number>();

    learners.forEach((learner) => {
      (learner.weaknesses ?? []).forEach((category) => {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      });
    });

    const totalLearners = learners.length || 1;

    return Array.from(counts.entries())
      .map(([category, learnerCount]) => ({
        category,
        label: getWeaknessLabel(category),
        learnerCount,
        percentage: Math.round((learnerCount / totalLearners) * 100),
      }))
      .sort((a, b) => b.learnerCount - a.learnerCount)
      .slice(0, TOP_CATEGORY_COUNT);
  }

  // GET .../reports/export?format=csv - the overview and module breakdown
  // for the current date range, saved as a file.
  exportCsv(): void {
    if (this.organisationId == null) {
      return;
    }
    this.reportsService.exportCsv(this.organisationId, this.range).subscribe({
      next: (csv) => {
        const url = URL.createObjectURL(csv);
        const link = document.createElement('a');
        link.href = url;
        link.download = `training-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.error = "Couldn't export the report";
      },
    });
  }

  // Exports as a PDF of the page itself, via the browser's native print
  // pipeline ("Save as PDF" in the print destination picker) -
  // trainer-reports.component.scss's @media print rules hide the toolbar
  // and filters, and styles.scss hides the app shell's nav/breadcrumbs.
  exportReport(): void {
    window.print();
  }
}
