import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
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
import {
  SelectModuleConfirmation,
  SelectModuleModalComponent,
} from 'src/app/shared/components/select-module-modal/select-module-modal.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { getScenarioOptionLabel, ScenarioAnswerMode } from '../../models/scenario.model';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { OrganisationFilterComponent } from 'src/app/organisations/components/organisation-filter/organisation-filter.component';
import { organisationScopeChanges } from 'src/app/organisations/+state/organisation-scope';
import { selectOrganisationScope } from 'src/app/organisations/+state/organisations.selectors';

@Component({
  selector: 'app-scenario-list',
  imports: [
    HeaderComponent,
    ListComponent,
    DashboardCardComponent,
    DeleteConfirmationModalComponent,
    SearchFilterBarComponent,
    SelectModuleModalComponent,
    OrganisationFilterComponent,
  ],
  templateUrl: './scenario-list.component.html',
  styleUrl: './scenario-list.component.scss',
})
export class ScenarioListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  columns: ListColumn[] = [];
  isGlobalAdmin = false;
  // Sent with every scenario list request - only set for a global admin,
  // whose list follows the organisation filter (null = every organisation).
  private scenarioOrganisationId: number | null = null;
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
  // are merged (see subscribeToAIScenarioCreateSuccess). pendingAiAnswerMode
  // is carried the same way, since the raw AI response doesn't say which
  // shape it is: GET /detailed-scenario returns the cue phrases under
  // `redFlags`, not `correctCues` (confirmed live), so the merge step has to
  // know the chosen mode to rename that field correctly.
  modules: { moduleId: number; moduleName: string }[] = [];
  // Every module the API returned - `modules` above is this narrowed to the
  // organisation filter, while row labels still resolve against all of them.
  private allModules: {
    moduleId: number;
    moduleName: string;
    organisationId?: number;
    organisationName?: string | null;
  }[] = [];
  isSelectModuleModalOpen = false;
  pendingAiModuleId: number | null = null;
  pendingAiAnswerMode: ScenarioAnswerMode = 'simple';

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
    // Reload the list whenever a global admin changes the organisation filter.
    organisationScopeChanges(this.store)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ isGlobalAdmin, organisationId }) => {
        this.scenarioOrganisationId = isGlobalAdmin ? organisationId : null;
        this.fetchScenarios();
      });
    // No userId - the trainer needs the org's full module catalog to choose
    // from, not a single learner's assignments.
    this.store.dispatch(ModulesActions.fetchList({}));
  }

  private fetchScenarios(): void {
    this.store.dispatch(
      ScenarioActions.fetchList({ organisationId: this.scenarioOrganisationId }),
    );
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

  // A global admin gets every organisation's modules back - the "Create
  // with AI" module picker only offers the ones in the filtered organisation,
  // and each module's organisation feeds the admin-only Organisation column.
  subscribeToModuleList(): void {
    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectOrganisationScope),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([moduleList, scope]) => {
        this.isGlobalAdmin = scope.isGlobalAdmin;
        this.allModules = (moduleList ?? []).map((module) => ({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          organisationId: module.organisationId,
          organisationName: module.organisationName,
        }));
        this.modules = this.allModules
          .filter(
            (module) =>
              !scope.isGlobalAdmin ||
              scope.organisationId == null ||
              module.organisationId === scope.organisationId,
          )
          .map(({ moduleId, moduleName }) => ({ moduleId, moduleName }));
        this.columns = this.buildColumns(this.rows);
      });
  }

  subscribeToAIScenarioCreateSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createAIScenarioSuccess))
      .subscribe((action: any) => {
        const aiScenario = action['scenario'];
        // GET /detailed-scenario returns the cue phrases under `redFlags`,
        // not `correctCues` (confirmed live) - rename it here so
        // toScenarioPayload sends correctCues, not neither field, which is
        // what the backend's "provide one, not both/neither" validation was
        // actually rejecting.
        const scenario =
          this.pendingAiAnswerMode === 'detailed'
            ? { ...aiScenario, correctCues: aiScenario?.redFlags, moduleId: this.pendingAiModuleId }
            : { ...aiScenario, moduleId: this.pendingAiModuleId };

        this.store.dispatch(ScenarioActions.createScenario({ scenario }));
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
        this.fetchScenarios();
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
        this.fetchScenarios();
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
   * `correctCues` array column) if the API response changes. The Module
   * column's valueFormatter closes over `this` (not a static array) so it
   * always resolves against the latest module catalog - GET /scenarios only
   * returns moduleId, not the module's name, so this joins it against the
   * list already fetched for the "Create with AI" module picker.
   */
  private buildColumns(rows: Record<string, unknown>[]): ListColumn[] {
    if (!rows.length) {
      return [];
    }

    const organisationColumn: ListColumn[] = this.isGlobalAdmin
      ? [
          {
            key: 'organisation',
            label: 'Organisation',
            valueFormatter: (_value, row) => this.getOrganisationName(row['moduleId']),
          },
        ]
      : [];

    return [
      { key: 'title', label: 'Title' },
      ...organisationColumn,
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
      {
        key: 'moduleId',
        label: 'Module',
        valueFormatter: (value) => this.getModuleName(value),
      },
    ];
  }

  private getModuleName(moduleId: unknown): string {
    if (moduleId == null) {
      return 'Unassigned';
    }

    const match = this.allModules.find((module) => module.moduleId === Number(moduleId));
    return match ? match.moduleName : String(moduleId);
  }

  private getOrganisationName(moduleId: unknown): string {
    const match = this.allModules.find((module) => module.moduleId === Number(moduleId));
    return match?.organisationName ?? '';
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

  confirmSelectModule(selection: SelectModuleConfirmation): void {
    this.isSelectModuleModalOpen = false;
    this.pendingAiModuleId = selection.moduleId;
    this.pendingAiAnswerMode = selection.answerMode;
    this.isCreatingWithAi = true;
    this.store.dispatch(ScenarioActions.createAIScenario({ answerMode: selection.answerMode }));
  }

  cancelSelectModule(): void {
    this.isSelectModuleModalOpen = false;
  }

  private handleCreateManually(): void {
    this.router.navigate(['/trainer/scenarios/create']);
  }
}
