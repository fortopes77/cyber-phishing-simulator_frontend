import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import {
  buildModuleProgress,
  ModuleProgressStatus,
} from 'src/app/module-results/+state/module-result.model';

interface ModuleScenario {
  id: string | number;
  title: string;
  type: string;
  difficulty: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
}

@Component({
  selector: 'app-module-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-page.component.html',
  styleUrls: ['./module-page.component.scss'],
})
export class ModulePageComponent implements OnInit {
  // Module ids are numeric (the backend's module PK) - see
  // LearnerModule.moduleId and ScenariosService.createScenario.
  moduleId = 0;
  title = 'Module';
  level = 'Beginner';

  scenarios: ModuleScenario[] = [];
  completedCount = 0;
  // Where the learner is up to in this module - drives the header tag and
  // the Start/Continue/Restart button.
  moduleStatus: ModuleProgressStatus = 'Assigned';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      // Route is defined as `learner/modules/:id` in app-routing.module.ts,
      // so the param key is `id`, not `slug`.
      const moduleId = Number(params.get('id')) || 0;
      this.moduleId = moduleId;

      if (moduleId) {
        // TODO: scope to the current learner's id once this page also needs
        // to filter by assignment (see UserDashboardComponent for that
        // wiring).
        this.store.dispatch(ModulesActions.fetchList({}));
        this.store.dispatch(
          ScenarioActions.fetchScenariosByModule({ moduleId }),
        );
        this.store.dispatch(ResultsActions.fetchMyResults());
      }
    });

    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
      this.store.select(selectMyResults),
    ]).subscribe(([moduleList, scenarioList, results]) => {
      const currentModule = (moduleList ?? []).find(
        (module: any) => module.moduleId === this.moduleId,
      );
      this.title = currentModule?.moduleName ?? 'Module';

      // scenarioList is scoped to this module via fetchScenariosByModule,
      // but guard against a stale/global list (e.g. loaded by another
      // screen) by filtering on moduleId when it's present on the scenario.
      const moduleScenarios = (scenarioList ?? []).filter(
        (scenario: any) =>
          scenario.moduleId == null || scenario.moduleId === this.moduleId,
      );

      this.level = this.deriveLevel(moduleScenarios);

      // A scenario is done if it was answered in the learner's current
      // attempt at this module (see buildModuleProgress) - an answer given
      // while the scenario sat in a different module doesn't count here.
      const { answeredScenarioIds, status } = buildModuleProgress(
        results,
        this.moduleId,
        moduleScenarios.map((scenario: any) => scenario.id),
      );

      this.scenarios = moduleScenarios.map((scenario: any) => ({
        id: scenario.id,
        title: scenario.title,
        type: scenario.type ?? scenario.category ?? 'Email',
        difficulty: scenario.difficulty,
        status: answeredScenarioIds.has(String(scenario.id))
          ? 'Completed'
          : 'Not Started',
      }));

      this.moduleStatus = status;
      this.completedCount = this.scenarios.filter(
        (scenario) => scenario.status === 'Completed',
      ).length;
    });
  }

  private deriveLevel(scenarios: any[]): string {
    const levelMap: Record<string, string> = {
      easy: 'Beginner',
      medium: 'Intermediate',
      hard: 'Advanced',
    };

    const counts: Record<string, number> = {};
    for (const scenario of scenarios) {
      const key = (scenario.difficulty ?? '').toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return levelMap[mostCommon?.[0]] ?? 'Beginner';
  }

  get progressPercentage(): number {
    if (!this.scenarios.length) {
      return 0;
    }

    return Math.round((this.completedCount / this.scenarios.length) * 100);
  }

  get isModuleComplete(): boolean {
    return this.moduleStatus === 'Passed' || this.moduleStatus === 'Not Passed';
  }

  get moduleActionLabel(): string {
    if (this.isModuleComplete) {
      return 'Restart Module';
    }
    return this.moduleStatus === 'In progress' ? 'Continue Module' : 'Start Module';
  }

  continueModule(): void {
    if (!this.scenarios.length) {
      return;
    }

    // Restarting a completed module starts again from its first scenario
    // (a fresh attempt - the completed one is finalised). Otherwise go to
    // the scenario the learner is "up to": the first one not yet answered in
    // their current attempt.
    const nextScenario = this.isModuleComplete
      ? this.scenarios[0]
      : this.scenarios.find((scenario) => scenario.status !== 'Completed') ||
        this.scenarios[0];

    this.router.navigate(['/learner/scenarios', nextScenario.id]);
  }
}
