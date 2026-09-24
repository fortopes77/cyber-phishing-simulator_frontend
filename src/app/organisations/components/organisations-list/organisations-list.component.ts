import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import {
  HeaderComponent,
  HeaderCreateAction,
} from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { SearchFilterBarComponent } from 'src/app/shared/components/search-filter-bar/search-filter-bar.component';
import {
  ListAction,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { OrganisationsActions } from '../../+state/organisations.actions';
import { selectOrganisationList } from '../../+state/organisations.selectors';
import { Organisation } from '../../+state/organisation.model';

interface OrganisationRow extends Record<string, unknown> {
  id: number;
  name: string;
  learnerCount: number;
  trainerCount: number;
  moduleCount: number;
}

// Global-admin-only management screen for every organisation on the
// platform (route data in app-routing.module.ts restricts it to 'admin').
@Component({
  selector: 'app-organisations-list',
  standalone: true,
  imports: [
    HeaderComponent,
    DashboardCardComponent,
    DeleteConfirmationModalComponent,
    SearchFilterBarComponent,
    ListComponent,
  ],
  templateUrl: './organisations-list.component.html',
  styleUrl: './organisations-list.component.scss',
})
export class OrganisationsListComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns: ListColumn[] = [
    { key: 'name', label: 'Organisation', sortable: true },
    { key: 'learnerCount', label: 'Learners', sortable: true },
    { key: 'trainerCount', label: 'Trainers', sortable: true },
    { key: 'moduleCount', label: 'Modules', sortable: true },
  ];

  readonly actions: ListAction[] = [
    {
      label: 'Edit',
      action: (row) => this.handleEdit(row),
      icon: iconLibrary.penIcon,
      tooltip: 'Rename organisation',
    },
    {
      label: 'Delete',
      action: (row) => this.handleDelete(row),
      icon: iconLibrary.trashIcon,
      tooltip: 'Delete organisation',
    },
  ];

  readonly createActions: HeaderCreateAction[] = [
    {
      label: 'Add Organisation',
      action: () => this.router.navigate(['/admin/organisations/create']),
    },
  ];

  allRows: OrganisationRow[] = [];
  rows: OrganisationRow[] = [];
  searchValue = '';

  isDeleteModalOpen = false;
  selectedOrganisation: OrganisationRow | null = null;
  deleteError: string | null = null;

  ngOnInit(): void {
    this.store
      .select(selectOrganisationList)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((organisations) => {
        this.allRows = organisations.map((organisation) => this.toRow(organisation));
        this.applySearch();
      });

    // The backend refuses to delete an organisation that still has users or
    // modules - surface its explanation rather than failing silently.
    this.actions$
      .pipe(
        ofType(OrganisationsActions.deleteOrganisationFailure),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ error }) => (this.deleteError = error));

    this.store.dispatch(OrganisationsActions.fetchList());
  }

  private toRow(organisation: Organisation): OrganisationRow {
    return {
      id: organisation.id,
      name: organisation.name,
      learnerCount: organisation.learnerCount,
      trainerCount: organisation.trainerCount,
      moduleCount: organisation.moduleCount ?? 0,
    };
  }

  onSearchChange(value: string): void {
    this.searchValue = value.trim().toLowerCase();
    this.applySearch();
  }

  private applySearch(): void {
    this.rows = this.searchValue
      ? this.allRows.filter((row) => row.name.toLowerCase().includes(this.searchValue))
      : [...this.allRows];
  }

  private handleEdit(row: Record<string, unknown>): void {
    this.router.navigate(['/admin/organisations', String(row['id']), 'edit']);
  }

  private handleDelete(row: Record<string, unknown>): void {
    this.selectedOrganisation = row as OrganisationRow;
    this.deleteError = null;
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = false;
    if (!this.selectedOrganisation) {
      return;
    }

    this.store.dispatch(
      OrganisationsActions.deleteOrganisation({
        organisationId: this.selectedOrganisation.id,
      }),
    );
    this.selectedOrganisation = null;
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedOrganisation = null;
  }
}
