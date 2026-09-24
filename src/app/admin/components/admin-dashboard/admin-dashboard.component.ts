import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { DashboardActions } from '../../+state/dashboard.actions';
import {
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardStats,
} from '../../+state/dashboard.selectors';
import { ModuleCompletion } from '../../+state/dashboard.model';
import { ActivityItem } from '../models/activity-item.model';
import { organisationScopeChanges } from 'src/app/organisations/+state/organisation-scope';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false,
})
export class AdminDashboardComponent implements OnInit {
  fontAwesomeIcons = iconLibrary;

  totalLearners = 0;
  activeModules = 0;
  completionRate = 0;
  averageScore = 0;
  moduleCompletion: ModuleCompletion[] = [];
  activities: ActivityItem[] = [];
  dashboardLoading = false;
  dashboardError: string | null = null;
  // A global admin with "All organisations" selected - the dashboard
  // endpoints only work for one organisation, so show a prompt instead.
  needsOrganisation = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscribeToDashboardStats();
    organisationScopeChanges(this.store)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ isGlobalAdmin, organisationId }) => {
        this.needsOrganisation = isGlobalAdmin && organisationId == null;
        if (!this.needsOrganisation) {
          this.store.dispatch(DashboardActions.fetchTrainerDashboard());
        }
      });
  }

  subscribeToDashboardStats(): void {
    this.store.select(selectDashboardStats).subscribe((stats) => {
      if (!stats) {
        return;
      }

      this.totalLearners = stats.totalLearners;
      this.activeModules = stats.activeModules;
      this.completionRate = stats.completionRate;
      this.averageScore = stats.averageScore;
      this.moduleCompletion = stats.moduleCompletion ?? [];
      this.activities = stats.recentActivity ?? [];
    });

    this.store.select(selectDashboardLoading).subscribe((loading) => {
      this.dashboardLoading = loading;
    });

    this.store.select(selectDashboardError).subscribe((error) => {
      this.dashboardError = error;
    });
  }

  viewModuleDetails(): void {
    this.router.navigate(['/trainer/modules']);
  }

  manageLearners(): void {
    this.router.navigate(['/trainer/learners']);
  }

  viewActiveModules(): void {
    this.router.navigate(['/trainer/modules']);
  }

  viewReports(): void {
    // PHISH-384 "Reporting & Analytics" is still To Do - points at the same
    // not-yet-built destination the sidebar's "Reports & Analytics" link
    // already targets, rather than inventing a new route.
    this.router.navigate(['/trainer/analytics']);
  }
}
