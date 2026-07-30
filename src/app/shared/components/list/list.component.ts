
import { Component, EventEmitter, Input, Output } from '@angular/core';

const PAGE_SIZE = 10;

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
  imports: [],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {
  @Input() columns: ListColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() actions: ListAction[] = [];
  @Input() emptyMessage = 'No items available.';
  @Input() pageSize = PAGE_SIZE;

  @Output() actionClicked = new EventEmitter<{
    action: ListAction;
    row: Record<string, unknown>;
  }>();

  currentPage = 1;

  get hasRows(): boolean {
    return this.rows?.length > 0;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get visibleRows(): Record<string, unknown>[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(startIndex, startIndex + this.pageSize);
  }

  get showPagination(): boolean {
    return this.rows.length > this.pageSize;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
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

  ngOnChanges(): void {
    this.currentPage = 1;
  }
}
