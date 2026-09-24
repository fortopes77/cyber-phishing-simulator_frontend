import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { OrganisationsState } from './organisations.reducer';
import { OrganisationScope } from './organisation.model';

export const selectOrganisationsState =
  createFeatureSelector<OrganisationsState>('organisations');
export const selectOrganisationList = createSelector(
  selectOrganisationsState,
  (state) => state?.organisationList ?? [],
);
export const selectOrganisation = createSelector(
  selectOrganisationsState,
  (state) => state?.organisation ?? null,
);
export const selectOrganisationsLoading = createSelector(
  selectOrganisationsState,
  (state) => state?.loading ?? false,
);
export const selectOrganisationsError = createSelector(
  selectOrganisationsState,
  (state) => state?.error ?? null,
);
export const selectOrganisationFilter = createSelector(
  selectOrganisationsState,
  (state) => state?.filterOrganisationId ?? null,
);

export const selectIsGlobalAdmin = createSelector(
  selectAuthState,
  (auth) => auth?.user?.role === 'admin',
);

/**
 * Which organisation's data a staff screen should load - see
 * OrganisationScope. Every staff screen reads this rather than
 * auth.user.organisationId directly, so a global admin's filter applies
 * everywhere at once.
 */
export const selectOrganisationScope = createSelector(
  selectIsGlobalAdmin,
  selectAuthState,
  selectOrganisationFilter,
  (isGlobalAdmin, auth, filterOrganisationId): OrganisationScope =>
    isGlobalAdmin
      ? { isGlobalAdmin, organisationId: filterOrganisationId }
      : { isGlobalAdmin, organisationId: auth?.user?.organisationId ?? null },
);

/** id -> name, for labelling rows with their organisation on admin screens. */
export const selectOrganisationNames = createSelector(
  selectOrganisationList,
  (organisations) =>
    new Map(organisations.map((organisation) => [organisation.id, organisation.name])),
);
