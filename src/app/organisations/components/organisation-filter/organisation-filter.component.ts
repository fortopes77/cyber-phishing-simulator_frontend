import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { combineLatest, filter, take } from 'rxjs';
import { OrganisationsActions } from '../../+state/organisations.actions';
import {
  selectIsGlobalAdmin,
  selectOrganisationFilter,
  selectOrganisationList,
} from '../../+state/organisations.selectors';
import { Organisation } from '../../+state/organisation.model';

/**
 * The global admin's organisation picker, dropped at the top of every staff
 * screen. Renders nothing for trainers (who are always locked to their own
 * organisation) and learners. The choice lives in the store (see
 * OrganisationsActions.setFilter), so it carries across screens.
 */
@Component({
  selector: 'app-organisation-filter',
  standalone: true,
  templateUrl: './organisation-filter.component.html',
  styleUrl: './organisation-filter.component.scss',
})
export class OrganisationFilterComponent implements OnInit {
  // Screens whose endpoint only works for a single organisation (the
  // dashboard, reports) set this to false to hide the "All organisations"
  // option - they show a prompt instead until one is chosen.
  @Input() allowAll = true;

  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  isGlobalAdmin = false;
  organisations: Organisation[] = [];
  selectedOrganisationId: number | null = null;

  ngOnInit(): void {
    combineLatest([
      this.store.select(selectIsGlobalAdmin),
      this.store.select(selectOrganisationList),
      this.store.select(selectOrganisationFilter),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isGlobalAdmin, organisations, selectedOrganisationId]) => {
        this.isGlobalAdmin = isGlobalAdmin;
        this.organisations = organisations;
        this.selectedOrganisationId = selectedOrganisationId;
      });

    // Load the options once per session, the first time an admin lands on
    // a screen with the filter.
    combineLatest([
      this.store.select(selectIsGlobalAdmin),
      this.store.select(selectOrganisationList),
    ])
      .pipe(
        take(1),
        filter(([isGlobalAdmin, organisations]) => isGlobalAdmin && !organisations.length),
      )
      .subscribe(() => this.store.dispatch(OrganisationsActions.fetchList()));
  }

  onChange(value: string): void {
    this.store.dispatch(
      OrganisationsActions.setFilter({ organisationId: value ? Number(value) : null }),
    );
  }
}
