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
import { ScenarioActions } from '../+state/scenario.actions';
import { selectScenarioList } from '../+state/scenario.selectors';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { Actions, ofType } from '@ngrx/effects';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-scenario-list',
  imports: [
    HeaderComponent,
    ListComponent,
    DashboardCardComponent,
    DeleteConfirmationModalComponent,
  ],
  templateUrl: './scenario-list.component.html',
  styleUrl: './scenario-list.component.scss',
})
export class ScenarioListComponent implements OnInit {
  columns: ListColumn[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];
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
      },
      {
        label: 'Delete',
        action: (row) => this.handleDelete(row),
      },
    ];

    this.subscribeToScenarioList();
    this.subscribeToAIScenarioCreateSuccess();
    this.subscribeToCreateScenarioSuccess();
    this.store.dispatch(ScenarioActions.fetchList());
  }

  subscribeToScenarioList(): void {
    this.store.select(selectScenarioList).subscribe((scenarioList) => {
      this.rows = Array.isArray(scenarioList)
        ? (scenarioList as Record<string, unknown>[])
        : [];
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
    this.selectedScenarioTitle = String(row['title'] ?? row['name'] ?? 'this scenario');
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
