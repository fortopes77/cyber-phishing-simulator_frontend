import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, UrlSegment } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { OrganisationEditComponent } from './organisation-edit.component';
import { OrganisationsActions } from '../../+state/organisations.actions';
import {
  selectOrganisation,
  selectOrganisationsError,
  selectOrganisationsLoading,
} from '../../+state/organisations.selectors';

describe('OrganisationEditComponent', () => {
  let component: OrganisationEditComponent;
  let fixture: ComponentFixture<OrganisationEditComponent>;
  let store: MockStore;
  let router: jasmine.SpyObj<Router>;
  let actions$: Subject<any>;

  // overrideSelector sets a module-level memoized result; clear it so this
  // spec's mocks don't leak into later specs that use the real selectors.
  afterEach(() => {
    store?.resetSelectors();
  });

  function setUp(path: string[], id: string | null) {
    actions$ = new Subject();
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [OrganisationEditComponent],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectOrganisation,
              value: { id: 4, name: 'Acme', learnerCount: 3, trainerCount: 1 },
            },
            { selector: selectOrganisationsLoading, value: false },
            { selector: selectOrganisationsError, value: null },
          ],
        }),
        provideMockActions(() => actions$),
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              url: path.map((segment) => new UrlSegment(segment, {})),
              paramMap: convertToParamMap(id ? { id } : {}),
            },
          },
        },
      ],
    });

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(OrganisationEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => setUp(['organisations', 'create'], null));

    it('should not fetch an existing organisation', () => {
      expect(component.isCreateMode).toBeTrue();
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should dispatch createOrganisation with the trimmed name', () => {
      component.organisationForm.setValue({ name: 'Globex  ' });
      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        OrganisationsActions.createOrganisation({ organisation: { name: 'Globex' } }),
      );
    });

    it('should reject names the backend would refuse', () => {
      component.organisationForm.setValue({ name: "Acme'; DROP TABLE" });
      component.onSubmit();

      expect(component.organisationForm.get('name')?.errors).toEqual({
        organisationName: true,
      });
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should return to the list once saved', () => {
      actions$.next(
        OrganisationsActions.createOrganisationSuccess({
          organisation: { id: 9, name: 'Globex', learnerCount: 0, trainerCount: 0 },
        }),
      );

      expect(router.navigate).toHaveBeenCalledWith(['/admin/organisations']);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setUp(['organisations', '4', 'edit'], '4'));

    it('should fetch and populate the organisation', () => {
      expect(store.dispatch).toHaveBeenCalledWith(
        OrganisationsActions.fetchDetails({ organisationId: 4 }),
      );
      expect(component.organisationForm.getRawValue()).toEqual({ name: 'Acme' });
    });

    it('should dispatch updateOrganisation', () => {
      component.organisationForm.setValue({ name: 'Acme Ltd' });
      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        OrganisationsActions.updateOrganisation({
          organisationId: 4,
          organisation: { name: 'Acme Ltd' },
        }),
      );
    });
  });
});
