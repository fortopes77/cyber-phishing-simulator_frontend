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
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

@Component({
  selector: 'app-scenario-list',
  imports: [
    HeaderComponent,
    ListComponent,
    DashboardCardComponent,
    DeleteConfirmationModalComponent,
    SearchFilterBarComponent,
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
    this.subscribeToAIScenarioCreateSuccess();
    this.subscribeToCreateScenarioSuccess();
    this.store.dispatch(ScenarioActions.fetchList());
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

  subscribeToAIScenarioCreateSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createAIScenarioSuccess))
      .subscribe((scenario: any) => {
        console.log(scenario);
        this.store.dispatch(
          ScenarioActions.createScenario({ scenario: scenario['scenario'] }),
        );
      });
  }

  subscribeToCreateScenarioSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createScenarioSuccess))
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

  private buildColumns(rows: Record<string, unknown>[]): ListColumn[] {
    if (!rows.length) {
      return [];
    }

    return Object.keys(rows[0]).map((key) => ({
      key,
      label: this.formatColumnLabel(key),
    }));
  }

  private formatColumnLabel(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
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

    console.log('Delete scenario', this.selectedScenarioRow);
    this.selectedScenarioRow = null;
    this.selectedScenarioTitle = '';
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedScenarioRow = null;
    this.selectedScenarioTitle = '';
  }

  private handleCreateWithAi(): void {
    this.store.dispatch(ScenarioActions.createAIScenario());
  }

  private handleCreateManually(): void {
    this.router.navigate(['/trainer/scenarios/create']);
  }
}
