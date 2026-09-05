import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import {
  faCircle,
  faCircleCheck,
  faClock,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { buildModuleResultsOverview } from 'src/app/module-results/+state/module-result.model';

interface ModuleCard {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scenarios: number;
  progress: number; // 0..1
  // Only meaningful once progress reaches 1 - defaults to false (not
  // pending/unknown) so a module that's finished but has no COMPLETED
  // moduleResult yet reads as failed rather than briefly flashing a pass.
  passed: boolean;
}

@Component({
  selector: 'app-learner-modules-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    FaIconComponent,
  ],
  templateUrl: './learner-modules-list.component.html',
  styleUrls: ['./learner-modules-list.component.scss'],
})
export class LearnerModulesListComponent implements OnInit {
  search = '';
  showFilters = false;
  difficultyFilter: '' | 'beginner' | 'intermediate' | 'advanced' = '';

  modules: ModuleCard[] = [];
  filteredModules: ModuleCard[] = [];

  constructor(private store: Store) {}

  ngOnInit(): void {
    // assignedToMe is self-scoped via the JWT (confirmed live against GET
    // /api-json and a real learner token: assignedToMe=true returns only
    // that learner's assigned modules), so this only shows modules assigned
    // to the signed-in learner rather than every module in the org.
    this.store.dispatch(ModulesActions.fetchList({ assignedToMe: true }));
    // Scenarios carry a moduleId (see scenario.service.ts createScenario
    // payload), so fetching the full list lets us group by module to work
    // out scenario counts, difficulty, and progress without a dedicated
    // "module scenarios" endpoint.
    this.store.dispatch(ScenarioActions.fetchList());
    this.store.dispatch(ResultsActions.fetchMyResults());

    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
      this.store.select(selectMyResults),
    ]).subscribe(([moduleList, scenarioList, results]) => {
      // scenario.id is numeric (normalizeScenario) but a result's
      // scenarioId is a string (results.model.ts), hence String() below.
      const completedScenarioIds = new Set(
        (results?.scenarioResults ?? []).map((result) => result.scenarioId),
      );

      // Per-module pass/fail, keyed by moduleId - buildModuleResultsOverview
      // already collapses a module's retries down to its most recent
      // COMPLETED attempt (see the module-results page), so it's reused here
      // instead of duplicating that dedup logic.
      const moduleResultByModuleId = new Map(
        buildModuleResultsOverview(results).map((row) => [row.moduleId, row]),
      );

      this.modules = (moduleList ?? []).map((module: any) => {
        const moduleScenarios = (scenarioList ?? []).filter(
          (scenario: any) => scenario.moduleId === module.moduleId,
        );

        const completedCount = moduleScenarios.filter((scenario: any) =>
          completedScenarioIds.has(String(scenario.id)),
        ).length;

        return {
          id: module.moduleId,
          title: module.moduleName,
          description: module.description,
          // No per-module difficulty field exists on the module list
          // endpoint - approximate it from the module's scenarios (which now
          // carry a real difficulty value from the backend).
          difficulty: this.deriveDifficulty(moduleScenarios),
          scenarios: moduleScenarios.length,
          progress: moduleScenarios.length
            ? completedCount / moduleScenarios.length
            : 0,
          passed: moduleResultByModuleId.get(module.moduleId)?.passed ?? false,
        };
      });

      this.applyFilters();
    });
  }

  private deriveDifficulty(
    scenarios: any[],
  ): 'beginner' | 'intermediate' | 'advanced' {
    const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      easy: 'beginner',
      medium: 'intermediate',
      hard: 'advanced',
    };

    const counts: Record<string, number> = {};
    for (const scenario of scenarios) {
      const key = (scenario.difficulty ?? '').toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return difficultyMap[mostCommon?.[0]] ?? 'beginner';
  }

  applyFilters(): void {
    const searchLower = this.search.trim().toLowerCase();
    this.filteredModules = this.modules.filter((m) => {
      if (this.difficultyFilter && m.difficulty !== this.difficultyFilter) {
        return false;
      }

      if (!searchLower) return true;
      return (
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
      );
    });
  }

  clearFilters(): void {
    this.difficultyFilter = '';
    this.search = '';
    this.applyFilters();
  }

  getStatusClass(progress: number, passed: boolean): string {
    if (progress >= 1) {
      return passed ? 'completed' : 'failed';
    }

    if (progress > 0) {
      return 'in-progress';
    }

    return 'not-started';
  }

  getStatusIcon(progress: number, passed: boolean): IconDefinition | string {
    if (progress >= 1) {
      return passed ? iconLibrary.checkCircleIcon : iconLibrary.closeIcon;
    }

    if (progress > 0) {
      return iconLibrary.clockIcon;
    }

    return iconLibrary.circleRegularIcon;
  }
}
