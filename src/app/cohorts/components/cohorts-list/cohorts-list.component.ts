import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import {
  ListAction,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

@Component({
  selector: 'app-cohorts-list',
  imports: [HeaderComponent, DashboardCardComponent, ListComponent],
  templateUrl: './cohorts-list.component.html',
  styleUrl: './cohorts-list.component.scss',
})
export class CohortsListComponent implements OnInit {
  columns: ListColumn[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];

  ngOnInit(): void {
    this.rows = [
      {
        id: 1,
        name: 'Q4 Security Awareness',
        program: 'Security Awareness',
        size: 24,
        status: 'Active',
        startDate: '2026-10-01',
      },
      {
        id: 2,
        name: 'Phishing Response Squad',
        program: 'Phishing Simulation',
        size: 18,
        status: 'Active',
        startDate: '2026-09-15',
      },
      {
        id: 3,
        name: 'Executive Risk Training',
        program: 'Leadership Training',
        size: 12,
        status: 'Draft',
        startDate: '2026-11-05',
      },
    ];

    this.actions = [
      {
        label: 'Edit',
        action: (row) => this.handleCohortAction('Edit', row),
        icon: iconLibrary.penIcon,
        tooltip: 'Edit cohort',
      },
      {
        label: 'Delete',
        action: (row) => this.handleCohortAction('Delete', row),
        icon: iconLibrary.trashIcon,
        tooltip: 'Delete cohort',
      },
    ];

    this.columns = this.buildColumns(this.rows);
  }

  private handleCohortAction(
    actionLabel: string,
    row: Record<string, unknown>,
  ): void {
    const cohortName = String(row['name'] ?? row['id'] ?? 'this cohort');
    console.log(`${actionLabel} for ${cohortName}`);
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
}
