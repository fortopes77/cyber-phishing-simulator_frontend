import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';

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
  moduleId = 0;
  title = 'Module';

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
      const moduleId = Number(params.get('id')) || 1;
      this.moduleId = moduleId;

      // Derive a readable title from the id until a real module-details
      // lookup is wired up (there's currently no `modules` NgRx feature).
      this.title = 'Module';

      if (moduleId) {
        this.store.dispatch(
          ScenarioActions.fetchScenariosByModule({ moduleId }),
        );
        this.store.dispatch(AttemptsActions.fetchUserAttempts());
      }
    });

    combineLatest([
      this.store.select(selectScenarioList),
      this.store.select(selectAttempts),
    ]).subscribe(([scenarioList, attempts]) => {
      const completedScenarioIds = new Set(
        attempts.map((attempt) => attempt.scenarioId),
      );

      this.scenarios = (scenarioList ?? []).map((scenario: any) => ({
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

  get progressPercentage(): number {
    if (!this.scenarios.length) {
      return 0;
    }

    return Math.round((this.completedCount / this.scenarios.length) * 100);
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
