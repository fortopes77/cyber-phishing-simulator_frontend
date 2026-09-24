import { createReducer, on } from '@ngrx/store';
import { AuthActions } from 'src/app/auth/+state/auth.actions';
import { OrganisationsActions } from './organisations.actions';
import { Organisation } from './organisation.model';

export interface OrganisationsState {
  organisationList: Organisation[];
  organisation: Organisation | null;
  filterOrganisationId: number | null;
  loading: boolean;
  error: string | null;
}

export const initialOrganisationsState: OrganisationsState = {
  organisationList: [],
  organisation: null,
  filterOrganisationId: null,
  loading: false,
  error: null,
};

const startRequest = (state: OrganisationsState): OrganisationsState => ({
  ...state,
  loading: true,
  error: null,
});

const failRequest = (
  state: OrganisationsState,
  { error }: { error: string },
): OrganisationsState => ({
  ...state,
  loading: false,
  error,
});

export const organisationsReducer = createReducer(
  initialOrganisationsState,
  on(OrganisationsActions.fetchList, startRequest),
  on(OrganisationsActions.fetchListSuccess, (state, { organisations }) => ({
    ...state,
    organisationList: organisations,
    loading: false,
  })),
  on(OrganisationsActions.fetchListFailure, failRequest),
  on(OrganisationsActions.fetchDetails, (state) => ({
    ...startRequest(state),
    organisation: null,
  })),
  on(OrganisationsActions.fetchDetailsSuccess, (state, { organisation }) => ({
    ...state,
    organisation,
    loading: false,
  })),
  on(OrganisationsActions.fetchDetailsFailure, failRequest),
  on(OrganisationsActions.createOrganisation, startRequest),
  on(OrganisationsActions.createOrganisationSuccess, (state, { organisation }) => ({
    ...state,
    organisationList: [...state.organisationList, organisation],
    loading: false,
  })),
  on(OrganisationsActions.createOrganisationFailure, failRequest),
  on(OrganisationsActions.updateOrganisation, startRequest),
  on(OrganisationsActions.updateOrganisationSuccess, (state, { organisation }) => ({
    ...state,
    organisation,
    organisationList: state.organisationList.map((existing) =>
      existing.id === organisation.id ? { ...existing, ...organisation } : existing,
    ),
    loading: false,
  })),
  on(OrganisationsActions.updateOrganisationFailure, failRequest),
  on(OrganisationsActions.deleteOrganisation, startRequest),
  on(OrganisationsActions.deleteOrganisationSuccess, (state, { organisationId }) => ({
    ...state,
    organisationList: state.organisationList.filter(
      (organisation) => organisation.id !== organisationId,
    ),
    // Don't leave the filter pointing at an organisation that no longer exists.
    filterOrganisationId:
      state.filterOrganisationId === organisationId ? null : state.filterOrganisationId,
    loading: false,
  })),
  on(OrganisationsActions.deleteOrganisationFailure, failRequest),
  on(OrganisationsActions.setFilter, (state, { organisationId }) => ({
    ...state,
    filterOrganisationId: organisationId,
  })),
  // A different account may sign in next - don't carry one admin's filter
  // (or organisation list) over to them.
  on(AuthActions.logoutSuccess, () => initialOrganisationsState),
);
