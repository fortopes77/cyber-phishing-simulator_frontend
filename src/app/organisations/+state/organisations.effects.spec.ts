import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { OrganisationsEffects } from './organisations.effects';
import { OrganisationsActions } from './organisations.actions';
import { OrganisationsService } from './organisations.service';

describe('OrganisationsEffects', () => {
  let effects: OrganisationsEffects;
  let actions$: Observable<any>;
  let service: jasmine.SpyObj<OrganisationsService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('OrganisationsService', [
      'getOrganisations',
      'getOrganisation',
      'createOrganisation',
      'updateOrganisation',
      'deleteOrganisation',
    ]);

    TestBed.configureTestingModule({
      providers: [
        OrganisationsEffects,
        provideMockActions(() => actions$),
        { provide: OrganisationsService, useValue: service },
      ],
    });

    effects = TestBed.inject(OrganisationsEffects);
  });

  it('should normalize the fetched list', (done) => {
    service.getOrganisations.and.returnValue(
      of([{ id: '3', name: 'Acme', learnerCount: 2, trainerCount: 1, moduleCount: 4 }]),
    );
    actions$ = of(OrganisationsActions.fetchList());

    effects.fetchList$.subscribe((action) => {
      expect(action).toEqual(
        OrganisationsActions.fetchListSuccess({
          organisations: [
            { id: 3, name: 'Acme', learnerCount: 2, trainerCount: 1, moduleCount: 4 },
          ],
        }),
      );
      done();
    });
  });

  it('should create an organisation', (done) => {
    service.createOrganisation.and.returnValue(of({ id: 7, name: 'Globex' }));
    actions$ = of(OrganisationsActions.createOrganisation({ organisation: { name: 'Globex' } }));

    effects.createOrganisation$.subscribe((action) => {
      expect(service.createOrganisation).toHaveBeenCalledWith({ name: 'Globex' });
      expect(action).toEqual(
        OrganisationsActions.createOrganisationSuccess({
          organisation: { id: 7, name: 'Globex', learnerCount: 0, trainerCount: 0 },
        }),
      );
      done();
    });
  });

  it("should surface the backend's reason when a delete is refused", (done) => {
    service.deleteOrganisation.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Cannot delete organisation 3: it still has users: 2' },
          }),
      ),
    );
    actions$ = of(OrganisationsActions.deleteOrganisation({ organisationId: 3 }));

    effects.deleteOrganisation$.subscribe((action) => {
      expect(action).toEqual(
        OrganisationsActions.deleteOrganisationFailure({
          error: 'Cannot delete organisation 3: it still has users: 2',
        }),
      );
      done();
    });
  });

  it('should join validation messages from the backend', (done) => {
    service.updateOrganisation.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: ['name should not be empty', 'name is too long'] },
          }),
      ),
    );
    actions$ = of(
      OrganisationsActions.updateOrganisation({ organisationId: 3, organisation: { name: '' } }),
    );

    effects.updateOrganisation$.subscribe((action) => {
      expect(action).toEqual(
        OrganisationsActions.updateOrganisationFailure({
          error: 'name should not be empty, name is too long',
        }),
      );
      done();
    });
  });
});
