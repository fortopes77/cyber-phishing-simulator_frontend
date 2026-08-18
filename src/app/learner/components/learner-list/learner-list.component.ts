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
  selector: 'app-learner-list',
  imports: [HeaderComponent, DashboardCardComponent, ListComponent],
  templateUrl: './learner-list.component.html',
  styleUrl: './learner-list.component.scss',
})
export class LearnerListComponent implements OnInit {
  columns: ListColumn[] = [];
  rows: Record<string, unknown>[] = [];
  actions: ListAction[] = [];

  ngOnInit(): void {
    this.rows = [
      {
        id: 1,
        fullName: 'Ava Morales',
        email: 'ava.morales@example.com',
        role: 'Learner',
        lastActive: '2 hours ago',
      },
      {
        id: 2,
        fullName: 'Noah Bennett',
        email: 'noah.bennett@example.com',
        role: 'Learner',
        lastActive: 'Yesterday',
      },
      {
        id: 3,
        fullName: 'Mia Chen',
        email: 'mia.chen@example.com',
        role: 'Learner',
        lastActive: '3 days ago',
      },
    ];

    this.actions = [
      {
        label: 'Edit',
        action: (row) => this.handleLearnerAction('Edit', row),
        icon: iconLibrary.penIcon,
      },
      {
        label: 'Delete',
        action: (row) => this.handleLearnerAction('Delete', row),
        icon: iconLibrary.trashIcon,
      },
      {
        label: 'Forgot password',
        action: (row) => this.handleLearnerAction('Forgot password', row),
        icon: iconLibrary.keyIcon,
      },
      {
        label: 'Deactivate',
        action: (row) => this.handleLearnerAction('Deactivate', row),
        icon: iconLibrary.userSlashIcon,
      },
      {
        label: 'Change assigned cohort',
        action: (row) =>
          this.handleLearnerAction('Change assigned cohort', row),
        icon: iconLibrary.exchangeIcon,
      },
    ];

    this.columns = this.buildColumns(this.rows);
  }

  private handleLearnerAction(
    actionLabel: string,
    row: Record<string, unknown>,
  ): void {
    const learnerName = String(
      row['fullName'] ?? row['email'] ?? 'this learner',
    );
    console.log(`${actionLabel} for ${learnerName}`);
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
