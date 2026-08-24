import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { User } from 'src/app/auth/auth.service';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  scenarios: number;
  progress: number; // 0..1
}

@Component({
  selector: 'app-modules-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    FaIconComponent,
  ],
  templateUrl: './modules-list.component.html',
  styleUrls: ['./modules-list.component.scss'],
})
export class ModulesListComponent implements OnInit {
  search = '';
  showFilters = false;
  difficultyFilter: '' | 'Beginner' | 'Intermediate' | 'Advanced' = '';

  modules: ModuleCard[] = [];
  filteredModules: ModuleCard[] = [];
  activeUser: User | null = null;
  fontAwesomeIcons = iconLibrary;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(ModulesActions.fetchList());
    // Scenarios carry a moduleId (see scenario.service.ts createScenario
    // payload), so fetching the full list lets us group by module to work
    // out scenario counts, difficulty, and progress without a dedicated
    // "module scenarios" endpoint.
    this.store.dispatch(ScenarioActions.fetchList());
    this.store.dispatch(AttemptsActions.fetchUserAttempts());
    this.subscribeToActiveUser();

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
          title: module.title,
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

  private subscribeToActiveUser(): void {
    this.store.select(selectAuthState).subscribe((authState) => {
      if (authState && authState.user) {
        this.activeUser = authState.user!;
      }
    });
  }

  private deriveDifficulty(
    scenarios: any[],
  ): 'Beginner' | 'Intermediate' | 'Advanced' {
    const difficultyMap: Record<
      string,
      'Beginner' | 'Intermediate' | 'Advanced'
    > = {
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
    return difficultyMap[mostCommon?.[0]] ?? 'Beginner';
  }

  applyFilters(): void {
    const searchLower = this.search.trim()?.toLowerCase();
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
