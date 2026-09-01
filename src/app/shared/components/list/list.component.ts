import {
  AfterContentInit,
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
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
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  FaIconComponent,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { iconLibrary } from '../../constants/font-awesome-icons.const';

const PAGE_SIZE = 10;

export interface ListCellTemplateContext {
  $implicit: Record<string, unknown>;
  row: Record<string, unknown>;
}

/**
 * Lets a parent project a custom template for one column's cells (e.g. an
 * avatar + name/email block, a progress bar, a badge list) while every
 * other column keeps rendering as plain text via `getCellValue`. Usage:
 * `<ng-template appListCell="columnKey" let-row>...</ng-template>` inside
 * `<app-list>`.
 */
@Directive({
  selector: '[appListCell]',
  standalone: true,
})
export class ListCellTemplateDirective {
  @Input('appListCell') column = '';

  constructor(public templateRef: TemplateRef<ListCellTemplateContext>) {}
}

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
    OverlayModule,
    FaIconComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements AfterContentInit, OnDestroy {
  private _columns: ListColumn[] = [];
  private _rows: Record<string, unknown>[] = [];
  private _actions: ListAction[] = [];
  openMenuRowKey: string | null = null;
  pageIndex = 0;
  private sortedRows: Record<string, unknown>[] = [];
  private cellTemplateMap: Record<string, TemplateRef<ListCellTemplateContext>> = {};
  private overlayRef: OverlayRef | null = null;

  @ContentChildren(ListCellTemplateDirective)
  cellTemplateDirectives!: QueryList<ListCellTemplateDirective>;

  @ViewChild('overflowMenuTemplate')
  overflowMenuTemplate!: TemplateRef<{
    $implicit: ListAction[];
    row: Record<string, unknown>;
  }>;

  constructor(
    private readonly overlay: Overlay,
    private readonly viewContainerRef: ViewContainerRef,
  ) {}

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

  ngAfterContentInit(): void {
    this.syncCellTemplates();
    this.cellTemplateDirectives.changes.subscribe(() =>
      this.syncCellTemplates(),
    );
  }

  private syncCellTemplates(): void {
    this.cellTemplateMap = {};
    this.cellTemplateDirectives.forEach((directive) => {
      this.cellTemplateMap[directive.column] = directive.templateRef;
    });
  }

  getCellTemplate(key: string): TemplateRef<ListCellTemplateContext> | null {
    return this.cellTemplateMap[key] ?? null;
  }

  private syncTableState(): void {
    this.sortedRows = [...this.rows];
    this.tableDataSource.sort = this.sort;
    this.sortActive = '';
    this.sortDirection = '';
    this.pageIndex = 0;
    this.updatePage();
  }

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.tableDataSource.data = this.sortedRows.slice(
      start,
      start + this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.pageIndex + 1;
    const windowSize = Math.min(5, total);
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
    return pages;
  }

  goToPage(page: number): void {
    this.pageIndex = Math.min(Math.max(page, 1), this.totalPages) - 1;
    this.updatePage();
  }

  previousPage(): void {
    this.goToPage(this.pageIndex);
  }

  nextPage(): void {
    this.goToPage(this.pageIndex + 2);
  }

  getCellValue(column: ListColumn, row: Record<string, unknown>): string {
    const rawValue = row[column.key];

    if (column.valueFormatter) {
      return column.valueFormatter(rawValue, row);
    }

    return rawValue == null ? '' : String(rawValue);
  }

  sortData(sort: Sort): void {
    this.pageIndex = 0;

    if (!sort.active) {
      this.sortActive = '';
      this.sortDirection = '';
      this.sortedRows = [...this.rows];
      this.updatePage();
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
      this.sortedRows = [...this.rows];
      this.updatePage();
      return;
    }

    this.sortActive = sort.active;
    this.sortDirection = direction;

    this.sortedRows = [...this.rows].sort((left, right) => {
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

    this.updatePage();
  }

  toggleActionsMenu(row: Record<string, unknown>, event: Event): void {
    event.stopPropagation();
    const rowKey = this.getRowMenuKey(row);

    if (this.openMenuRowKey === rowKey) {
      this.closeOverflowMenu();
      return;
    }

    this.openOverflowMenu(row, event.currentTarget as HTMLElement);
  }

  handleAction(action: ListAction, row: Record<string, unknown>): void {
    action.action(row);
    this.actionClicked.emit({ action, row });
    this.closeOverflowMenu();
  }

  /**
   * The overflow "⋯" menu used to be a CSS-positioned `position: absolute`
   * div anchored inside the table cell. That works fine for a couple of
   * rows, but `.list-scroll-container` has `overflow: auto` for long
   * tables, which clips (or otherwise visually buries) any row's dropdown
   * that opens near the bottom of the visible scroll area - the menu was
   * rendering "under" the next row instead of on top of it. A CDK Overlay
   * portals the menu into `.cdk-overlay-container`, appended directly to
   * `<body>`, so it's never clipped by an ancestor's overflow and always
   * paints above the table (CDK's default overlay z-index).
   */
  private openOverflowMenu(row: Record<string, unknown>, trigger: HTMLElement): void {
    this.closeOverflowMenu();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 4,
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -4,
        },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    const portal = new TemplatePortal(
      this.overflowMenuTemplate,
      this.viewContainerRef,
      { $implicit: this.overflowActions, row },
    );
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.closeOverflowMenu());
    this.openMenuRowKey = this.getRowMenuKey(row);
  }

  private closeOverflowMenu(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.openMenuRowKey = null;
  }

  ngOnDestroy(): void {
    this.closeOverflowMenu();
  }

  getRowMenuKey(row: Record<string, unknown>): string {
    const rowIndex = this.rows.indexOf(row);
    return rowIndex >= 0 ? `row-${rowIndex}` : JSON.stringify(row);
  }

  getActionIcon(action: ListAction): IconDefinition {
    if (!action.icon) {
      return this.fontAwesomeIcons.arrowRightIcon ?? faCircle;
    }

    if (typeof action.icon === 'string') {
      const iconKey = `${action.icon}Icon`;
      return (
        (this.fontAwesomeIcons[
          iconKey as keyof typeof this.fontAwesomeIcons
        ] as IconDefinition | undefined) ?? faCircle
      );
    }

    return action.icon as IconDefinition;
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
