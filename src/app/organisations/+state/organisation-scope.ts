import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, Observable } from 'rxjs';
import { OrganisationScope } from './organisation.model';
import { selectOrganisationScope } from './organisations.selectors';

/**
 * Emits the current OrganisationScope, then again whenever it changes (a
 * global admin picking a different organisation), so a staff screen can
 * (re)load its data in one place. Holds back until the scope is usable - a
 * trainer whose session hasn't restored an organisationId yet has nothing
 * to load.
 */
export function organisationScopeChanges(store: Store): Observable<OrganisationScope> {
  return store.select(selectOrganisationScope).pipe(
    filter((scope) => scope.isGlobalAdmin || scope.organisationId != null),
    distinctUntilChanged(
      (previous, current) =>
        previous.isGlobalAdmin === current.isGlobalAdmin &&
        previous.organisationId === current.organisationId,
    ),
  );
}
