import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import {
  selectMyResults,
  selectResultsError,
  selectResultsLoading,
} from 'src/app/results/+state/results.selectors';
import {
  buildModuleResult,
  buildModuleResultsOverview,
  ModuleResult,
  ModuleResultOverviewRow,
} from 'src/app/module-results/+state/module-result.model';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-module-results',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './module-results.component.html',
  styleUrls: ['./module-results.component.scss'],
})
export class ModuleResultsComponent implements OnInit {
  moduleId: number | null = null;
  result: ModuleResult | null = null;
  overview: ModuleResultOverviewRow[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // GET /results/module/:id is trainer/admin-only (confirmed 403 for a
    // learner token) and there's no learner-facing per-module-result
    // endpoint, so this reuses GET /results/me - already the source for the
    // dashboard/module-page completion tracking - and builds both views
    // client-side from its moduleResults/scenarioResults.
    this.store.dispatch(ResultsActions.fetchMyResults());

    // This component backs two routes: 'learner/results' (the nav sidebar's
    // "Results" link, no moduleId - shows the all-modules overview) and
    // 'learner/modules/:moduleId/results' (a single module's breakdown,
    // reached from continueToNext() in ScenarioChoiceComponent once the
    // learner finishes every scenario in the module, or by clicking a row
    // in the overview). Navigating between two modules' results pages
    // reuses this component rather than recreating it, so moduleId is read
    // from the live paramMap observable rather than a snapshot to pick that
    // up.
    combineLatest([this.route.paramMap, this.store.select(selectMyResults)]).subscribe(
      ([params, results]) => {
        const moduleIdParam = params.get('moduleId');
        this.moduleId = moduleIdParam ? Number(moduleIdParam) : null;

        if (this.moduleId != null) {
          this.result = buildModuleResult(results, this.moduleId);
          this.overview = [];
        } else {
          this.overview = buildModuleResultsOverview(results);
          this.result = null;
        }
      },
    );

    this.store.select(selectResultsLoading).subscribe((loading) => {
      this.loading = loading;
    });

    this.store.select(selectResultsError).subscribe((error) => {
      this.error = error;
    });
  }

  viewModuleResult(moduleId: number): void {
    this.router.navigate(['/learner/modules', moduleId, 'results']);
  }

  backToResultsOverview(): void {
    this.router.navigate(['/learner/results']);
  }

  retryModule(): void {
    if (this.moduleId == null) {
      return;
    }
    this.router.navigate(['/learner/modules', this.moduleId]);
  }

  backToAssignedModules(): void {
    this.router.navigate(['/learner/modules']);
  }

  backToDashboard(): void {
    this.router.navigate(['/learner/dashboard']);
  }
}
