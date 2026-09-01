import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ModuleResultsActions } from 'src/app/module-results/+state/module-results.actions';
import {
  selectModuleResult,
  selectModuleResultError,
  selectModuleResultLoading,
} from 'src/app/module-results/+state/module-results.selectors';
import { ModuleResult } from 'src/app/module-results/+state/module-result.model';

@Component({
  selector: 'app-module-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-results.component.html',
  styleUrls: ['./module-results.component.scss'],
})
export class ModuleResultsComponent implements OnInit {
  moduleId: number | null = null;
  result: ModuleResult | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // continueToNext() in ScenarioChoiceComponent navigates here with
    // ?moduleId=... once the learner has finished every scenario in the
    // module - a query param rather than a route param, since /learner/results
    // isn't scoped under a particular module's path.
    const moduleIdParam = this.route.snapshot.queryParamMap.get('moduleId');
    this.moduleId = moduleIdParam ? Number(moduleIdParam) : null;

    if (this.moduleId) {
      this.store.dispatch(
        ModuleResultsActions.fetchModuleResult({ moduleId: this.moduleId }),
      );
    }

    this.store.select(selectModuleResult).subscribe((result) => {
      this.result = result;
    });

    this.store.select(selectModuleResultLoading).subscribe((loading) => {
      this.loading = loading;
    });

    this.store.select(selectModuleResultError).subscribe((error) => {
      this.error = error;
    });
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
