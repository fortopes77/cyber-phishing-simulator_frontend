import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { AuthService, User } from '../../../auth/auth.service';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { LearningProgress } from '../../models/learning-progress.model';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { LearnerResults } from 'src/app/results/+state/results.model';

interface AssignedModule {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  scenarios: number;
  status: string;
  progressPercentage: number;
  route?: string;
}

interface DashboardStats {
  modulesCompleted: number;
  totalModules: number;
  scenariosCompleted: number;
  totalScenarios: number;
  averageScore: number;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  standalone: false,
})
export class UserDashboardComponent implements OnInit {
  currentUser?: User;
  fontAwesomeIcon = iconLibrary;

  continueLearning: LearningProgress | null = null;
  assignedModules: AssignedModule[] = [];
  stats: DashboardStats = {
    modulesCompleted: 0,
    totalModules: 0,
    scenariosCompleted: 0,
    totalScenarios: 0,
    averageScore: 0,
  };

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subscribeToAuthUser();

    // assignedToMe is self-scoped via the JWT (confirmed live against GET
    // /api-json and a real learner token), so this can dispatch immediately
    // rather than waiting on the auth subscription to resolve a userId.
    this.store.dispatch(ModulesActions.fetchList({ assignedToMe: true }));
    this.store.dispatch(ScenarioActions.fetchList());
    this.store.dispatch(ResultsActions.fetchMyResults());

    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
      this.store.select(selectMyResults),
    ]).subscribe(([moduleList, scenarioList, results]) => {
      // GET /results/me - confirmed live to return isCorrect/scenarioId per
      // completed scenario (see results.model.ts). scenario.id is numeric
      // (normalizeScenario) but a result's scenarioId is a string, hence
      // String() below.
      const completedScenarioIds = new Set(
        (results?.scenarioResults ?? []).map((result) => result.scenarioId),
      );

      this.assignedModules = (moduleList ?? []).map((module: any) => {
        const moduleScenarios = (scenarioList ?? []).filter(
          (scenario: any) => scenario.moduleId === module.moduleId,
        );
        const completedCount = moduleScenarios.filter((scenario: any) =>
          completedScenarioIds.has(String(scenario.id)),
        ).length;
        const progress = moduleScenarios.length
          ? completedCount / moduleScenarios.length
          : 0;

        return {
          id: module.moduleId,
          title: module.moduleName,
          description: module.description,
          level: this.deriveLevel(moduleScenarios),
          scenarios: moduleScenarios.length,
          status:
            progress >= 1
              ? 'Completed'
              : progress > 0
                ? 'In progress'
                : 'Assigned',
          progressPercentage: Math.round(progress * 100),
          route: `/learner/modules/${module.moduleId}`,
        };
      });

      // "Continue Learning" only surfaces a module actually in progress -
      // hidden entirely (not a fallback to a not-yet-started module) when
      // the learner has nothing partway done.
      const inProgress = this.assignedModules.find(
        (m) => m.progressPercentage > 0 && m.progressPercentage < 100,
      );

      this.continueLearning = inProgress
        ? {
            id: inProgress.id,
            title: inProgress.title,
            level: inProgress.level,
            completedScenarios: Math.round(
              (inProgress.progressPercentage / 100) * inProgress.scenarios,
            ),
            totalScenarios: inProgress.scenarios,
            progressPercentage: inProgress.progressPercentage,
            icon: 'schedule',
            route: inProgress.route,
          }
        : null;

      const totalScenarios = (scenarioList ?? []).length;
      const scenariosCompleted = (scenarioList ?? []).filter((scenario: any) =>
        completedScenarioIds.has(String(scenario.id)),
      ).length;

      this.stats = {
        modulesCompleted: this.assignedModules.filter(
          (m) => m.progressPercentage >= 100,
        ).length,
        totalModules: this.assignedModules.length,
        scenariosCompleted,
        totalScenarios,
        averageScore: this.deriveAverageScore(results),
      };
    });
  }

  // The backend's own averageScore (when it sends one) beats a client-side
  // recomputation from the individual scenario results.
  private deriveAverageScore(results: LearnerResults | null): number {
    if (results?.averageScore != null) {
      return results.averageScore;
    }

    if (!results?.scenarioResults.length) {
      return 0;
    }

    const correctCount = results.scenarioResults.filter(
      (result) => result.correct,
    ).length;
    return Math.round((correctCount / results.scenarioResults.length) * 100);
  }

  private deriveLevel(
    scenarios: any[],
  ): 'Beginner' | 'Intermediate' | 'Advanced' {
    const map: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
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
    return map[mostCommon?.[0]] ?? 'Beginner';
  }

  subscribeToAuthUser() {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState?.isAuthenticated && authState.user) {
        this.currentUser = authState.user;
      }
    });
  }

  onAssignedModuleSelected(module: AssignedModule): void {
    console.log('Assigned module selected:', module.title);
  }

  viewAllModules(): void {
    this.router.navigate(['/learner/modules']);
  }
}
