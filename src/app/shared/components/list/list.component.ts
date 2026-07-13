import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ListColumn {
  key: string;
  label: string;
  valueFormatter?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface ListAction {
  label: string;
  action: (row: Record<string, unknown>) => void;
}

@Component({
  selector: 'app-list',
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {
  @Input() columns: ListColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() actions: ListAction[] = [];
  @Input() emptyMessage = 'No items available.';

  @Output() actionClicked = new EventEmitter<{
    action: ListAction;
    row: Record<string, unknown>;
  }>();

  get hasRows(): boolean {
    return this.rows?.length > 0;
  }

  getCellValue(column: ListColumn, row: Record<string, unknown>): string {
    const rawValue = row[column.key];

    if (column.valueFormatter) {
      return column.valueFormatter(rawValue, row);
    }

    return rawValue == null ? '' : String(rawValue);
  }

  handleAction(action: ListAction, row: Record<string, unknown>): void {
    action.action(row);
    this.actionClicked.emit({ action, row });
  }

  handleRowClick(row: Record<string, unknown>): void {
    if (this.actions.length) {
      this.handleAction(this.actions[0], row);
    }
  }
}
