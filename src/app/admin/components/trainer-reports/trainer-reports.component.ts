import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { ProgressRowComponent } from 'src/app/shared/components/progress-row/progress-row.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { getWeaknessLabel, UserAccount } from 'src/app/users/+state/user-account.model';
import { DashboardActions } from '../../+state/dashboard.actions';
import {
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardStats,
} from '../../+state/dashboard.selectors';
import { ModuleCompletion } from '../../+state/dashboard.model';
import { ActivityItem } from '../models/activity-item.model';
import { ActivityListComponent } from '../activity-list/activity-list.component';

interface CategoryBreakdown {
  category: string;
  label: string;
  learnerCount: number;
  percentage: number;
}

const NEEDS_ATTENTION_THRESHOLD = 60;
const TOP_LIST_SIZE = 5;
const TOP_CATEGORY_COUNT = 6;

/**
 * Trainer-facing reporting screen (PHISH-384) - built entirely from
 * endpoints the trainer dashboard already uses (GET
 * /organisations/{orgId}/trainer-dashboard(/activity), GET /users/learners),
 * joined and aggregated client-side. No new backend endpoint was needed:
 * the CSV export is assembled from the same data already on screen.
 */
@Component({
  selector: 'app-trainer-reports',
  imports: [HeaderComponent, DashboardCardComponent, DataCardComponent, ProgressRowComponent, ActivityListComponent],
  templateUrl: './trainer-reports.component.html',
  styleUrl: './trainer-reports.component.scss',
})
export class TrainerReportsComponent implements OnInit {
  fontAwesomeIcons = iconLibrary;

  totalLearners = 0;
  activeModules = 0;
  completionRate = 0;
  averageScore = 0;
  moduleCompletion: ModuleCompletion[] = [];
  recentActivity: ActivityItem[] = [];
  dashboardLoading = false;
  dashboardError: string | null = null;

  learners: UserAccount[] = [];
  categoryBreakdown: CategoryBreakdown[] = [];
  topPerformers: UserAccount[] = [];
  needsAttention: UserAccount[] = [];

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.subscribeToDashboardStats();
    this.subscribeToLearners();
    this.store.dispatch(DashboardActions.fetchTrainerDashboard());
    this.fetchLearners();
  }

  private subscribeToDashboardStats(): void {
    this.store.select(selectDashboardStats).subscribe((stats) => {
      if (!stats) {
        return;
      }

      this.totalLearners = stats.totalLearners;
      this.activeModules = stats.activeModules;
      this.completionRate = stats.completionRate;
      this.averageScore = stats.averageScore;
      this.moduleCompletion = stats.moduleCompletion ?? [];
      this.recentActivity = stats.recentActivity ?? [];
    });

    this.store.select(selectDashboardLoading).subscribe((loading) => {
      this.dashboardLoading = loading;
    });

    this.store.select(selectDashboardError).subscribe((error) => {
      this.dashboardError = error;
    });
  }

  // GET /users/learners is scoped to one organisation - read it off the
  // signed-in trainer's own account, same as LearnerListComponent.
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

  private subscribeToLearners(): void {
    this.store.select(selectUserList).subscribe((learners) => {
      this.learners = learners ?? [];
      this.categoryBreakdown = this.buildCategoryBreakdown(this.learners);
      this.topPerformers = this.buildTopPerformers(this.learners);
      this.needsAttention = this.buildNeedsAttention(this.learners);
    });
  }

  // Counts how many learners carry each weakness category, so a trainer can
  // see which threats their organisation as a whole struggles with, not
  // just individual learners (which the Learners list already covers).
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

  private buildTopPerformers(learners: UserAccount[]): UserAccount[] {
    return learners
      .filter((learner) => learner.averageScore != null)
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
      .slice(0, TOP_LIST_SIZE);
  }

  private buildNeedsAttention(learners: UserAccount[]): UserAccount[] {
    return learners
      .filter((learner) => learner.averageScore != null && learner.averageScore < NEEDS_ATTENTION_THRESHOLD)
      .sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0))
      .slice(0, TOP_LIST_SIZE);
  }

  // Exports as a PDF of the page itself, via the browser's native print
  // pipeline ("Save as PDF" in the print destination picker), rather than a
  // generated data file - trainer-reports.component.scss's @media print
  // rules hide the export button/toolbar chrome and the app shell's nav/
  // breadcrumbs (see styles.scss) so what prints is just the report.
  exportReport(): void {
    window.print();
  }
}
