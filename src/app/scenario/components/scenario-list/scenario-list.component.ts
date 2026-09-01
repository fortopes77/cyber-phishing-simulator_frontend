import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  HeaderComponent,
  HeaderCreateAction,
} from 'src/app/shared/components/header/header.component';
import {
  ListAction,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { ScenarioActions } from '../../+state/scenario.actions';
import { selectScenarioList } from '../../+state/scenario.selectors';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { Actions, ofType } from '@ngrx/effects';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { SearchFilterBarComponent } from 'src/app/shared/components/search-filter-bar/search-filter-bar.component';
import { SelectModuleModalComponent } from 'src/app/shared/components/select-module-modal/select-module-modal.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { getScenarioOptionLabel } from '../../models/scenario.model';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';

@Component({
  selector: 'app-scenario-list',
  imports: [
    HeaderComponent,
    ListComponent,
    DashboardCardComponent,
    DeleteConfirmationModalComponent,
    SearchFilterBarComponent,
    SelectModuleModalComponent,
  ],
  templateUrl: './scenario-list.component.html',
  styleUrl: './scenario-list.component.scss',
})
export class ScenarioListComponent implements OnInit {
  columns: ListColumn[] = [];
  allRows: Record<string, unknown>[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];
  searchValue = '';
  filterValue = 'all';
  filterOptions: string[] = [];
  createActions: HeaderCreateAction[] = [
    {
      label: 'Create with AI',
      action: () => this.handleCreateWithAi(),
    },
    {
      label: 'Create manually',
      action: () => this.handleCreateManually(),
    },
  ];

  isDeleteModalOpen = false;
  selectedScenarioTitle = '';
  selectedScenarioRow: Record<string, unknown> | null = null;
  isCreatingWithAi = false;

  // The AI generation API has no concept of a module - it only produces
  // scenario content - but POST /scenarios requires one, so the trainer
  // picks it up front via isSelectModuleModalOpen, and it's carried in
  // pendingAiModuleId until the generated content comes back and the two
  // are merged (see subscribeToAIScenarioCreateSuccess).
  modules: { moduleId: number; moduleName: string }[] = [];
  isSelectModuleModalOpen = false;
  pendingAiModuleId: number | null = null;

  constructor(
    private store: Store,
    private router: Router,
    private actions$: Actions,
  ) {}

  ngOnInit(): void {
    this.actions = [
      {
        label: 'Edit',
        action: (row) => this.handleEdit(row),
        icon: iconLibrary.penIcon,
        tooltip: 'Edit scenario',
      },
      {
        label: 'Delete',
        action: (row) => this.handleDelete(row),
        icon: iconLibrary.trashIcon,
        tooltip: 'Delete scenario',
      },
    ];

    this.subscribeToScenarioList();
    this.subscribeToModuleList();
    this.subscribeToAIScenarioCreateSuccess();
    this.subscribeToAIScenarioCreateFailure();
    this.subscribeToCreateScenarioSuccess();
    this.subscribeToCreateScenarioFailure();
    this.subscribeToDeleteScenarioSuccess();
    this.store.dispatch(ScenarioActions.fetchList());
    // No userId - the trainer needs the org's full module catalog to choose
    // from, not a single learner's assignments.
    this.store.dispatch(ModulesActions.fetchList({}));
  }

  subscribeToScenarioList(): void {
    this.store.select(selectScenarioList).subscribe((scenarioList) => {
      this.allRows = Array.isArray(scenarioList)
        ? (scenarioList as Record<string, unknown>[])
        : [];
      this.rows = [...this.allRows];
      this.filterOptions = this.extractFilterOptions(this.allRows);
      this.applyFilters();
      this.columns = this.buildColumns(this.rows);
    });
  }

  subscribeToModuleList(): void {
    this.store.select(selectModuleList).subscribe((moduleList) => {
      this.modules = (moduleList ?? []).map((module) => ({
        moduleId: module.moduleId,
        moduleName: module.moduleName,
      }));
    });
  }

  subscribeToAIScenarioCreateSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createAIScenarioSuccess))
      .subscribe((scenario: any) => {
        this.store.dispatch(
          ScenarioActions.createScenario({
            scenario: { ...scenario['scenario'], moduleId: this.pendingAiModuleId },
          }),
        );
      });
  }

  subscribeToAIScenarioCreateFailure(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createAIScenarioFailure))
      .subscribe(() => {
        this.isCreatingWithAi = false;
      });
  }

  subscribeToCreateScenarioSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createScenarioSuccess))
      .subscribe(() => {
        this.isCreatingWithAi = false;
        this.store.dispatch(ScenarioActions.fetchList());
      });
  }

  subscribeToCreateScenarioFailure(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createScenarioFailure))
      .subscribe(() => {
        this.isCreatingWithAi = false;
      });
  }

  subscribeToDeleteScenarioSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.deleteScenarioSuccess))
      .subscribe(() => {
        this.store.dispatch(ScenarioActions.fetchList());
      });
  }

  onSearchChange(value: string): void {
    this.searchValue = value.trim().toLowerCase();
    this.applyFilters();
  }

  onFilterChange(value: string): void {
    this.filterValue = value;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.rows = this.allRows.filter((row) => {
      const searchText = this.searchValue;
      const filterValue = this.filterValue;
      const valueString = this.getRowSearchText(row).toLowerCase();
      const matchesSearch = !searchText || valueString.includes(searchText);
      const matchesFilter =
        filterValue === 'all' || this.matchesFilter(row, filterValue);

      return matchesSearch && matchesFilter;
    });

    this.columns = this.buildColumns(this.rows);
  }

  private getRowSearchText(row: Record<string, unknown>): string {
    return Object.values(row).join(' ').toLowerCase();
  }

  private matchesFilter(
    row: Record<string, unknown>,
    filterValue: string,
  ): boolean {
    const normalizedFilter = filterValue.toLowerCase();

    const difficulty = String(row['difficulty'] ?? '').toLowerCase();
    if (difficulty === normalizedFilter) {
      return true;
    }

    const category = String(row['category'] ?? '').toLowerCase();
    if (category === normalizedFilter) {
      return true;
    }

    const title = String(row['title'] ?? row['name'] ?? '').toLowerCase();
    if (title.includes(normalizedFilter)) {
      return true;
    }

    return false;
  }

  private extractFilterOptions(rows: Record<string, unknown>[]): string[] {
    const values = new Set<string>();

    rows.forEach((row) => {
      const difficulty = String(row['difficulty'] ?? '').trim();
      const category = String(row['category'] ?? '').trim();

      if (difficulty) {
        values.add(difficulty);
      }

      if (category) {
        values.add(category);
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  /**
   * The scenarios API returns `content`/`scenarioDescription` alongside the
   * fields below, but those are long free text and don't belong in a table row -
   * they're only shown in the edit form. Columns are a fixed set matching
   * the Scenario resource rather than derived from whatever keys happen to
   * be on the first row, so the table doesn't shift shape (or grow a
   * `correctCues` array column) if the API response changes.
   */
  private static readonly COLUMNS: ListColumn[] = [
    { key: 'title', label: 'Title' },
    {
      key: 'category',
      label: 'Category',
      valueFormatter: (value) => getScenarioOptionLabel(value),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      valueFormatter: (value) => getScenarioOptionLabel(value),
    },
    {
      key: 'interactionType',
      label: 'Interaction Type',
      valueFormatter: (value) => getScenarioOptionLabel(value),
    },
    { key: 'moduleId', label: 'Module' },
  ];

  private buildColumns(rows: Record<string, unknown>[]): ListColumn[] {
    if (!rows.length) {
      return [];
    }

    return ScenarioListComponent.COLUMNS;
  }

  private handleEdit(row: Record<string, unknown>): void {
    const scenarioId = row['id'] ?? row['_id'];

    if (scenarioId == null) {
      return;
    }

    this.router.navigate(['/trainer/scenarios', String(scenarioId), 'edit']);
  }

  private handleDelete(row: Record<string, unknown>): void {
    this.selectedScenarioRow = row;
    this.selectedScenarioTitle = String(
      row['title'] ?? row['name'] ?? 'this scenario',
    );
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = false;
    if (!this.selectedScenarioRow) {
      return;
    }
    this.store.dispatch(
      ScenarioActions.deleteScenario({
        scenarioId: String(
          this.selectedScenarioRow['id'] ?? this.selectedScenarioRow['_id'],
        ),
      }),
    );
    this.selectedScenarioRow = null;
    this.selectedScenarioTitle = '';
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedScenarioRow = null;
    this.selectedScenarioTitle = '';
  }

  private handleCreateWithAi(): void {
    if (this.isCreatingWithAi) {
      return;
    }

    this.isSelectModuleModalOpen = true;
  }

  confirmSelectModule(moduleId: number): void {
    this.isSelectModuleModalOpen = false;
    this.pendingAiModuleId = moduleId;
    this.isCreatingWithAi = true;
    this.store.dispatch(ScenarioActions.createAIScenario());
  }

  cancelSelectModule(): void {
    this.isSelectModuleModalOpen = false;
  }

  private handleCreateManually(): void {
    this.router.navigate(['/trainer/scenarios/create']);
  }
}
