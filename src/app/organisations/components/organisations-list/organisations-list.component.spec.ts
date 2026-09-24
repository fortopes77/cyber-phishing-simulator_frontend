import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { OrganisationsListComponent } from './organisations-list.component';
import { OrganisationsActions } from '../../+state/organisations.actions';
import { selectOrganisationList } from '../../+state/organisations.selectors';

describe('OrganisationsListComponent', () => {
  let component: OrganisationsListComponent;
  let fixture: ComponentFixture<OrganisationsListComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Subject<any>;

  // overrideSelector sets a module-level memoized result; clear it so this
  // spec's mocks don't leak into later specs that use the real selectors.
  afterEach(() => {
    store?.resetSelectors();
  });

  beforeEach(async () => {
    actions$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [OrganisationsListComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectOrganisationList,
              value: [
                { id: 1, name: 'Acme', learnerCount: 4, trainerCount: 1, moduleCount: 2 },
                { id: 2, name: 'Globex', learnerCount: 0, trainerCount: 0 },
              ],
            },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(OrganisationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should fetch the organisation list on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(OrganisationsActions.fetchList());
  });

  it('should build a row per organisation, defaulting a missing module count to 0', () => {
    expect(component.rows).toEqual([
      { id: 1, name: 'Acme', learnerCount: 4, trainerCount: 1, moduleCount: 2 },
      { id: 2, name: 'Globex', learnerCount: 0, trainerCount: 0, moduleCount: 0 },
    ]);
  });

  it('should filter rows by name', () => {
    component.onSearchChange('glob');

    expect(component.rows.map((row) => row.name)).toEqual(['Globex']);
  });

  it('should navigate to the edit page', () => {
    component.actions.find((action) => action.label === 'Edit')!.action(component.rows[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/admin/organisations', '1', 'edit']);
  });

  it('should delete only after confirmation', () => {
    component.actions.find((action) => action.label === 'Delete')!.action(component.rows[1]);
    expect(component.isDeleteModalOpen).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalledWith(
      OrganisationsActions.deleteOrganisation({ organisationId: 2 }),
    );

    component.confirmDelete();

    expect(store.dispatch).toHaveBeenCalledWith(
      OrganisationsActions.deleteOrganisation({ organisationId: 2 }),
    );
  });

  it('should show why a delete was refused', () => {
    actions$.next(
      OrganisationsActions.deleteOrganisationFailure({ error: 'it still has users: 4' }),
    );

    expect(component.deleteError).toBe('it still has users: 4');
  });
});
