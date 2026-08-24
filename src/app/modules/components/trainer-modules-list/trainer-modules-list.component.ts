import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import {
  ListAction,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { SearchFilterBarComponent } from 'src/app/shared/components/search-filter-bar/search-filter-bar.component';
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
  ],
  templateUrl: './trainer-modules-list.component.html',
  styleUrl: './trainer-modules-list.component.scss',
})
export class TrainerModulesListComponent implements OnInit {
  columns: ListColumn[] = [
    { key: 'title', label: 'Module Name' },
    { key: 'version', label: 'Version' },
    { key: 'description', label: 'Description' },
    { key: 'scenarioCount', label: 'Scenarios' },
  ];
  allRows: Record<string, unknown>[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];
  searchValue = '';
  filterValue = 'all';
  filterOptions: string[] = [];

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.actions = [
      {
        label: 'Manage Scenarios',
        action: (row) => this.handleManageScenarios(row),
        icon: iconLibrary.groupLayerIcon,
        tooltip: 'View scenarios for this module',
      },
    ];

    this.store.dispatch(ModulesActions.fetchList());
    this.store.dispatch(ScenarioActions.fetchList());

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
          title: module.title,
          version: module.version ?? '—',
          description: module.description,
          scenarioCount,
        };
      });

      this.applyFilters();
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

      const searchText = `${row['title']} ${row['description']}`.toLowerCase();
      return searchText.includes(this.searchValue);
    });
  }

  private handleManageScenarios(row: Record<string, unknown>): void {
    this.router.navigate(['/trainer/scenarios']);
  }
}
