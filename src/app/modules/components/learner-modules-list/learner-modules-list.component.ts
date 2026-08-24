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
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';

interface ModuleCard {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scenarios: number;
  progress: number; // 0..1
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
    this.store.dispatch(ModulesActions.fetchList());
    // Scenarios carry a moduleId (see scenario.service.ts createScenario
    // payload), so fetching the full list lets us group by module to work
    // out scenario counts, difficulty, and progress without a dedicated
    // "module scenarios" endpoint.
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

      this.modules = (moduleList ?? []).map((module: any) => {
        const moduleScenarios = (scenarioList ?? []).filter(
          (scenario: any) => scenario.moduleId === module.moduleId,
        );

        const completedCount = moduleScenarios.filter((scenario: any) =>
          completedScenarioIds.has(scenario.id),
        ).length;

        return {
          id: module.moduleId,
          title: module.moduleName,
          description: module.description,
          // No per-module difficulty field exists on the module list
          // endpoint - approximate it from the module's scenarios until
          // the backend exposes one directly.
          difficulty: this.deriveDifficulty(moduleScenarios),
          scenarios: moduleScenarios.length,
          progress: moduleScenarios.length
            ? completedCount / moduleScenarios.length
            : 0,
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

  getStatusClass(progress: number): string {
    if (progress >= 1) {
      return 'completed';
    }

    if (progress > 0) {
      return 'in-progress';
    }

    return 'not-started';
  }

  getStatusIcon(progress: number): IconDefinition | string {
    if (progress >= 1) {
      return iconLibrary.checkCircleIcon;
    }

    if (progress > 0) {
      return iconLibrary.clockIcon;
    }

    return iconLibrary.circleRegularIcon;
  }
}
