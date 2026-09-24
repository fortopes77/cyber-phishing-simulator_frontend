import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { OrganisationFilterComponent } from './organisation-filter.component';
import { OrganisationsActions } from '../../+state/organisations.actions';
import {
  selectIsGlobalAdmin,
  selectOrganisationFilter,
  selectOrganisationList,
} from '../../+state/organisations.selectors';

describe('OrganisationFilterComponent', () => {
  let fixture: ComponentFixture<OrganisationFilterComponent>;
  let store: MockStore;

  // overrideSelector sets a module-level memoized result; clear it so this
  // spec's mocks don't leak into later specs that use the real selectors.
  afterEach(() => {
    store?.resetSelectors();
  });

  const organisations = [
    { id: 1, name: 'Acme', learnerCount: 0, trainerCount: 0 },
    { id: 2, name: 'Globex', learnerCount: 0, trainerCount: 0 },
  ];

  function setUp(isGlobalAdmin: boolean, list = organisations, filter: number | null = null) {
    TestBed.configureTestingModule({
      imports: [OrganisationFilterComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsGlobalAdmin, value: isGlobalAdmin },
            { selector: selectOrganisationList, value: list },
            { selector: selectOrganisationFilter, value: filter },
          ],
        }),
      ],
    });

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(OrganisationFilterComponent);
  }

  it('should render nothing for a trainer', () => {
    setUp(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should list every organisation plus "All organisations" for a global admin', () => {
    setUp(true);
    fixture.detectChanges();

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>,
    ).map((option) => option.textContent?.trim());
    expect(options).toEqual(['All organisations', 'Acme', 'Globex']);
  });

  it('should hide "All organisations" when a single organisation is required', () => {
    setUp(true);
    fixture.componentInstance.allowAll = false;
    fixture.detectChanges();

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>,
    ).map((option) => option.textContent?.trim());
    expect(options).toEqual(['Select an organisation', 'Acme', 'Globex']);
  });

  it('should fetch the organisation list the first time an admin sees it', () => {
    setUp(true, []);
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(OrganisationsActions.fetchList());
  });

  it('should dispatch setFilter when an organisation is picked', () => {
    setUp(true);
    fixture.detectChanges();

    fixture.componentInstance.onChange('2');
    expect(store.dispatch).toHaveBeenCalledWith(
      OrganisationsActions.setFilter({ organisationId: 2 }),
    );

    fixture.componentInstance.onChange('');
    expect(store.dispatch).toHaveBeenCalledWith(
      OrganisationsActions.setFilter({ organisationId: null }),
    );
  });
});
