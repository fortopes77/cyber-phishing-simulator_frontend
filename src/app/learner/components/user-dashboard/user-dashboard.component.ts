import { Component, OnInit } from '@angular/core';
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
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';

interface AssignedModule {
  id: string;
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

  constructor(private store: Store) {}

  ngOnInit() {
    this.subscribeToAuthUser();

    this.store.dispatch(ModulesActions.fetchList());
    this.store.dispatch(ScenarioActions.fetchList());
    this.store.dispatch(AttemptsActions.fetchUserAttempts());

    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
      this.store.select(selectAttempts),
    ]).subscribe(([moduleList, scenarioList, attempts]) => {
      const completedScenarioIds = new Set(
        attempts.map((attempt) => attempt.scenarioId),
      );

      this.assignedModules = (moduleList ?? []).map((module: any) => {
        const moduleScenarios = (scenarioList ?? []).filter(
          (scenario: any) => scenario.moduleId === module.moduleId,
        );
        const completedCount = moduleScenarios.filter((scenario: any) =>
          completedScenarioIds.has(scenario.id),
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

      // "Continue Learning" surfaces the module already in progress, or
      // the next not-yet-started one if nothing is in progress.
      const inProgress = this.assignedModules.find(
        (m) => m.progressPercentage > 0 && m.progressPercentage < 100,
      );
      const nextUp =
        inProgress ??
        this.assignedModules.find((m) => m.progressPercentage === 0);

      this.continueLearning = nextUp
        ? {
            id: nextUp.id,
            title: nextUp.title,
            level: nextUp.level,
            completedScenarios: Math.round(
              (nextUp.progressPercentage / 100) * nextUp.scenarios,
            ),
            totalScenarios: nextUp.scenarios,
            progressPercentage: nextUp.progressPercentage,
            icon: 'schedule',
            route: nextUp.route,
          }
        : null;

      const totalScenarios = (scenarioList ?? []).length;
      const scenariosCompleted = (scenarioList ?? []).filter((scenario: any) =>
        completedScenarioIds.has(scenario.id),
      ).length;
      const correctAttempts = attempts.filter((a) => a.correct).length;

      this.stats = {
        modulesCompleted: this.assignedModules.filter(
          (m) => m.progressPercentage >= 100,
        ).length,
        totalModules: this.assignedModules.length,
        scenariosCompleted,
        totalScenarios,
        averageScore: attempts.length
          ? Math.round((correctAttempts / attempts.length) * 100)
          : 0,
      };
    });
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
      if (authState?.isAuthenticated) {
        this.currentUser = authState.user;
      }
    });
  }

  onAssignedModuleSelected(module: AssignedModule): void {
    console.log('Assigned module selected:', module.title);
  }
}
