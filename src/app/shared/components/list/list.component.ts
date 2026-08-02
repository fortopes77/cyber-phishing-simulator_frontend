import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MatSort,
  MatSortModule,
  Sort,
  SortDirection,
} from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FaIconComponent,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { iconLibrary } from '../../constants/font-awesome-icons.const';

const PAGE_SIZE = 10;

export interface ListColumn {
  key: string;
  label: string;
  valueFormatter?: (value: unknown, row: Record<string, unknown>) => string;
  sortable?: boolean;
}

export interface ListAction {
  label: string;
  action: (row: Record<string, unknown>) => void;
  icon?: IconDefinition | string;
  tooltip?: string;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    FaIconComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {
  private _columns: ListColumn[] = [];
  private _rows: Record<string, unknown>[] = [];
  private _actions: ListAction[] = [];

  @Input()
  set columns(value: ListColumn[]) {
    this._columns = value ?? [];
    this.syncTableState();
  }

  get columns(): ListColumn[] {
    return this._columns;
  }

  @Input()
  set rows(value: Record<string, unknown>[]) {
    this._rows = value ?? [];
    this.syncTableState();
  }

  get rows(): Record<string, unknown>[] {
    return this._rows;
  }

  @Input()
  set actions(value: ListAction[]) {
    this._actions = value ?? [];
    this.syncTableState();
  }

  get actions(): ListAction[] {
    return this._actions;
  }

  @Input() emptyMessage = 'No items available.';
  @Input() pageSize = PAGE_SIZE;

  @Output() actionClicked = new EventEmitter<{
    action: ListAction;
    row: Record<string, unknown>;
  }>();

  @ViewChild(MatSort) sort!: MatSort;

  readonly fontAwesomeIcons = iconLibrary;
  readonly tableDataSource = new MatTableDataSource<Record<string, unknown>>(
    [],
  );
  sortActive = '';
  sortDirection: SortDirection = '';

  get hasRows(): boolean {
    return this.rows?.length > 0;
  }

  get actionsColumnLabel(): string {
    return this.actions.length ? 'Actions' : '';
  }

  get displayedColumns(): string[] {
    const columns = this.columns.map((column) => column.key);
    return this.actions.length ? [...columns, 'actions'] : columns;
  }

  get shouldUseDropdown(): boolean {
    return this.actions.length > 2;
  }

  get visibleActions(): ListAction[] {
    return this.actions.slice(0, 2);
  }

  get overflowActions(): ListAction[] {
    return this.actions.slice(2);
  }

  ngOnChanges(): void {
    this.syncTableState();
  }

  ngAfterViewInit(): void {
    this.syncTableState();
    if (this.sort) {
      this.tableDataSource.sort = this.sort;
    }
  }

  private syncTableState(): void {
    this.tableDataSource.data = [...this.rows];
    this.tableDataSource.sort = this.sort;
    this.sortActive = '';
    this.sortDirection = '';
  }

  getCellValue(column: ListColumn, row: Record<string, unknown>): string {
    const rawValue = row[column.key];

    if (column.valueFormatter) {
      return column.valueFormatter(rawValue, row);
    }

    return rawValue == null ? '' : String(rawValue);
  }

  sortData(sort: Sort): void {
    if (!sort.active) {
      this.sortActive = '';
      this.sortDirection = '';
      this.tableDataSource.data = [...this.rows];
      return;
    }

    const activeColumn = this.columns.find(
      (column) => column.key === sort.active,
    );
    if (activeColumn?.sortable === false) {
      return;
    }

    const direction = sort.direction as SortDirection;
    if (direction !== 'asc' && direction !== 'desc') {
      this.sortActive = '';
      this.sortDirection = '';
      this.tableDataSource.data = [...this.rows];
      return;
    }

    this.sortActive = sort.active;
    this.sortDirection = direction;

    const sortedRows = [...this.rows].sort((left, right) => {
      const leftValue = left[sort.active];
      const rightValue = right[sort.active];
      const leftText = leftValue == null ? '' : String(leftValue).toLowerCase();
      const rightText =
        rightValue == null ? '' : String(rightValue).toLowerCase();

      if (leftText < rightText) {
        return direction === 'asc' ? -1 : 1;
      }

      if (leftText > rightText) {
        return direction === 'asc' ? 1 : -1;
      }

      return 0;
    });

    this.tableDataSource.data = sortedRows;
  }

  toggleActionsMenu(index: number, event: Event): void {
    event.stopPropagation();
  }

  handleAction(action: ListAction, row: Record<string, unknown>): void {
    action.action(row);
    this.actionClicked.emit({ action, row });
  }

  getActionIcon(action: ListAction): unknown {
    if (!action.icon) {
      return this.fontAwesomeIcons.arrowRightIcon;
    }

    if (typeof action.icon === 'string') {
      const iconKey = `${action.icon}Icon`;
      return (
        this.fontAwesomeIcons[iconKey as keyof typeof this.fontAwesomeIcons] ??
        this.fontAwesomeIcons.arrowRightIcon
      );
    }

    return action.icon;
  }

  getActionTooltip(action: ListAction): string {
    return action.tooltip ?? action.label;
  }

  handleRowClick(row: Record<string, unknown>): void {
    if (this.actions.length) {
      this.handleAction(this.actions[0], row);
    }
  }
}
