import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { combineLatest } from 'rxjs';
import { HeaderComponent, HeaderCreateAction } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import {
  ListAction,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { SearchFilterBarComponent } from 'src/app/shared/components/search-filter-bar/search-filter-bar.component';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';

@Component({
  selector: 'app-trainer-modules-list',
  standalone: true,
  imports: [
    HeaderComponent,
    DashboardCardComponent,
    ListComponent,
    SearchFilterBarComponent,
    DeleteConfirmationModalComponent,
  ],
  templateUrl: './trainer-modules-list.component.html',
  styleUrl: './trainer-modules-list.component.scss',
})
export class TrainerModulesListComponent implements OnInit {
  columns: ListColumn[] = [
    { key: 'moduleName', label: 'Module Name' },
    { key: 'description', label: 'Description' },
    { key: 'scenarioCount', label: 'Scenarios' },
  ];
  allRows: Record<string, unknown>[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];
  searchValue = '';
  filterValue = 'all';
  filterOptions: string[] = [];

  createActions: HeaderCreateAction[] = [
    {
      label: 'Create Module',
      action: () => this.handleCreate(),
    },
  ];

  isDeleteModalOpen = false;
  selectedModuleName = '';
  selectedModuleRow: Record<string, unknown> | null = null;

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
        tooltip: 'Edit module',
      },
      {
        label: 'Manage Scenarios',
        action: (row) => this.handleManageScenarios(row),
        icon: iconLibrary.groupLayerIcon,
        tooltip: 'View scenarios for this module',
      },
      {
        label: 'Delete',
        action: (row) => this.handleDelete(row),
        icon: iconLibrary.trashIcon,
        tooltip: 'Delete module',
      },
    ];

    this.subscribeToModuleList();
    this.subscribeToDeleteModuleSuccess();
    this.fetchModules();
  }

  private fetchModules(): void {
    // No userId - a trainer manages the org's full module catalog, not a
    // single learner's assignments.
    this.store.dispatch(ModulesActions.fetchList({}));
    this.store.dispatch(ScenarioActions.fetchList());
  }

  private subscribeToModuleList(): void {
    combineLatest([
      this.store.select(selectModuleList),
      this.store.select(selectScenarioList),
    ]).subscribe(([moduleList, scenarioList]) => {
      this.allRows = (moduleList ?? []).map((module: any) => {
        const scenarioCount = (scenarioList ?? []).filter(
          (scenario: any) => scenario.moduleId === module.moduleId,
        ).length;

        return {
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          description: module.description,
          scenarioCount,
        };
      });

      this.applyFilters();
    });
  }

  private subscribeToDeleteModuleSuccess(): void {
    this.actions$
      .pipe(ofType(ModulesActions.deleteModuleSuccess))
      .subscribe(() => {
        this.fetchModules();
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
      if (!this.searchValue) return true;

      const searchText = `${row['moduleName']} ${row['description']}`.toLowerCase();
      return searchText.includes(this.searchValue);
    });
  }

  private handleEdit(row: Record<string, unknown>): void {
    const moduleId = row['moduleId'];
    if (moduleId == null) {
      return;
    }
    this.router.navigate(['/trainer/modules', String(moduleId), 'edit']);
  }

  private handleManageScenarios(row: Record<string, unknown>): void {
    this.router.navigate(['/trainer/scenarios']);
  }

  private handleDelete(row: Record<string, unknown>): void {
    this.selectedModuleRow = row;
    this.selectedModuleName = String(row['moduleName'] ?? 'this module');
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = false;
    if (!this.selectedModuleRow) {
      return;
    }

    this.store.dispatch(
      ModulesActions.deleteModule({
        moduleId: Number(this.selectedModuleRow['moduleId']),
      }),
    );
    this.selectedModuleRow = null;
    this.selectedModuleName = '';
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedModuleRow = null;
    this.selectedModuleName = '';
  }

  private handleCreate(): void {
    this.router.navigate(['/trainer/modules/create']);
  }
}
