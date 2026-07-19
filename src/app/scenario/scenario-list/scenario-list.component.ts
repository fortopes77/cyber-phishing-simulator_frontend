import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-scenario-list',
  imports: [HeaderComponent, ListComponent, DashboardCardComponent],
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

  constructor(
    private store: Store,
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
    this.subscribeToScenarioCreateSuccess();
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

  subscribeToScenarioCreateSuccess(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.createScenarioSuccess))
      .subscribe((scenario: any) => {
        console.log(scenario);
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
    console.log('Edit scenario', row);
  }

  private handleDelete(row: Record<string, unknown>): void {
    console.log('Delete scenario', row);
  }

  private handleCreateWithAi(): void {
    this.store.dispatch(ScenarioActions.createScenario());
  }

  private handleCreateManually(): void {
    console.log('Create scenario manually');
  }
}
