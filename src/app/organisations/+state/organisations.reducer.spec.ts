import { AuthActions } from 'src/app/auth/+state/auth.actions';
import { OrganisationsActions } from './organisations.actions';
import { initialOrganisationsState, organisationsReducer } from './organisations.reducer';
import { Organisation } from './organisation.model';

describe('organisationsReducer', () => {
  const acme: Organisation = { id: 1, name: 'Acme', learnerCount: 4, trainerCount: 1, moduleCount: 2 };
  const globex: Organisation = { id: 2, name: 'Globex', learnerCount: 0, trainerCount: 0, moduleCount: 0 };
  const loaded = { ...initialOrganisationsState, organisationList: [acme, globex] };

  it('should store the fetched list', () => {
    const state = organisationsReducer(
      { ...initialOrganisationsState, loading: true },
      OrganisationsActions.fetchListSuccess({ organisations: [acme] }),
    );

    expect(state.organisationList).toEqual([acme]);
    expect(state.loading).toBeFalse();
  });

  it('should append a created organisation', () => {
    const state = organisationsReducer(
      { ...initialOrganisationsState, organisationList: [acme] },
      OrganisationsActions.createOrganisationSuccess({ organisation: globex }),
    );

    expect(state.organisationList).toEqual([acme, globex]);
  });

  it('should replace an updated organisation, keeping counts the response lacks', () => {
    const state = organisationsReducer(
      loaded,
      OrganisationsActions.updateOrganisationSuccess({
        organisation: { id: 1, name: 'Acme Ltd', learnerCount: 4, trainerCount: 1 },
      }),
    );

    expect(state.organisationList[0]).toEqual({ ...acme, name: 'Acme Ltd' });
  });

  it('should drop a deleted organisation and clear a filter pointing at it', () => {
    const state = organisationsReducer(
      { ...loaded, filterOrganisationId: 2 },
      OrganisationsActions.deleteOrganisationSuccess({ organisationId: 2 }),
    );

    expect(state.organisationList).toEqual([acme]);
    expect(state.filterOrganisationId).toBeNull();
  });

  it('should keep the backend error on a failed delete', () => {
    const state = organisationsReducer(
      loaded,
      OrganisationsActions.deleteOrganisationFailure({ error: 'still has users' }),
    );

    expect(state.error).toBe('still has users');
    expect(state.organisationList.length).toBe(2);
  });

  it('should set the organisation filter', () => {
    const state = organisationsReducer(
      loaded,
      OrganisationsActions.setFilter({ organisationId: 2 }),
    );

    expect(state.filterOrganisationId).toBe(2);
  });

  it('should reset on logout so the next account starts clean', () => {
    const state = organisationsReducer(
      { ...loaded, filterOrganisationId: 1 },
      AuthActions.logoutSuccess(),
    );

    expect(state).toEqual(initialOrganisationsState);
  });
});
