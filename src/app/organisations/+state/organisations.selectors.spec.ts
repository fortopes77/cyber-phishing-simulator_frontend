import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { initialOrganisationsState } from './organisations.reducer';
import {
  selectIsGlobalAdmin,
  selectOrganisationFilter,
  selectOrganisationList,
  selectOrganisationNames,
  selectOrganisationScope,
  selectOrganisationsState,
} from './organisations.selectors';

describe('organisations selectors', () => {
  // Component specs mock these via MockStore.overrideSelector, which sets a
  // module-level result - clear it so these tests run the real projectors.
  beforeEach(() => {
    [
      selectAuthState,
      selectOrganisationsState,
      selectOrganisationList,
      selectOrganisationFilter,
      selectIsGlobalAdmin,
      selectOrganisationScope,
      selectOrganisationNames,
    ].forEach((selector: any) => {
      selector.release();
      selector.clearResult();
    });
  });

  const stateFor = (role: string, organisationId: number | undefined, filterOrganisationId: number | null) =>
    ({
      auth: {
        isAuthenticated: true,
        loading: false,
        user: { id: '1', username: 'u', email: 'u@u.com', role, organisationId },
      },
      organisations: {
        ...initialOrganisationsState,
        organisationList: [
          { id: 1, name: 'Acme', learnerCount: 0, trainerCount: 0 },
          { id: 2, name: 'Globex', learnerCount: 0, trainerCount: 0 },
        ],
        filterOrganisationId,
      },
    }) as any;

  it('should lock a trainer to their own organisation, ignoring any filter', () => {
    expect(selectOrganisationScope(stateFor('trainer', 5, 2))).toEqual({
      isGlobalAdmin: false,
      organisationId: 5,
    });
  });

  it("should use a global admin's filter", () => {
    expect(selectOrganisationScope(stateFor('admin', 9, 2))).toEqual({
      isGlobalAdmin: true,
      organisationId: 2,
    });
  });

  it('should treat a global admin with no filter as every organisation', () => {
    expect(selectOrganisationScope(stateFor('admin', 9, null))).toEqual({
      isGlobalAdmin: true,
      organisationId: null,
    });
  });

  it('should only flag the admin role as global admin', () => {
    expect(selectIsGlobalAdmin(stateFor('admin', 9, null))).toBeTrue();
    expect(selectIsGlobalAdmin(stateFor('trainer', 5, null))).toBeFalse();
    expect(selectIsGlobalAdmin(stateFor('user', 5, null))).toBeFalse();
  });

  it('should map organisation ids to names', () => {
    const names = selectOrganisationNames(stateFor('admin', 9, null));

    expect(names.get(1)).toBe('Acme');
    expect(names.get(2)).toBe('Globex');
  });

  it('should cope with the organisations feature not being registered yet', () => {
    const state = { auth: stateFor('admin', 9, null).auth } as any;

    expect(selectOrganisationScope(state)).toEqual({
      isGlobalAdmin: true,
      organisationId: null,
    });
  });
});
