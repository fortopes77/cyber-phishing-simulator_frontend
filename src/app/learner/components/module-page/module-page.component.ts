import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';

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
        this.store.dispatch(AttemptsActions.fetchUserAttempts());
      }
    });

    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
      this.store.select(selectAttempts),
    ]).subscribe(([moduleList, scenarioList, attempts]) => {
      const currentModule = (moduleList ?? []).find(
        (module: any) => module.moduleId === this.moduleId,
      );
      this.title = currentModule?.moduleName ?? 'Module';

      const completedScenarioIds = new Set(
        attempts.map((attempt) => attempt.scenarioId),
      );

      // scenarioList is scoped to this module via fetchScenariosByModule,
      // but guard against a stale/global list (e.g. loaded by another
      // screen) by filtering on moduleId when it's present on the scenario.
      const moduleScenarios = (scenarioList ?? []).filter(
        (scenario: any) =>
          scenario.moduleId == null || scenario.moduleId === this.moduleId,
      );

      this.level = this.deriveLevel(moduleScenarios);

      this.scenarios = moduleScenarios.map((scenario: any) => ({
        id: scenario.id,
        title: scenario.title,
        type: scenario.type ?? scenario.category ?? 'Email',
        difficulty: scenario.difficulty,
        status: completedScenarioIds.has(scenario.id)
          ? 'Completed'
          : 'Not Started',
      }));

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
    return (
      this.scenarios.length > 0 &&
      this.completedCount === this.scenarios.length
    );
  }

  continueModule(): void {
    if (!this.scenarios.length) {
      return;
    }

    // The scenario the learner is "up to": the first one in the module
    // that doesn't yet have a completed attempt. If everything is done,
    // fall back to the first scenario so they can review.
    const nextScenario =
      this.scenarios.find((scenario) => scenario.status !== 'Completed') ||
      this.scenarios[0];

    this.router.navigate(['/learner/scenarios', nextScenario.id]);
  }
}
