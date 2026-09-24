import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { OrganisationsActions } from './organisations.actions';
import { OrganisationsService } from './organisations.service';
import { normalizeOrganisation } from './organisation.model';

// The backend's own message (e.g. 'An organisation called "Acme" already
// exists', or why a delete was refused) is far more useful to show than
// HttpErrorResponse's generic "Http failure response for ...".
function errorMessage(error: any, fallback: string): string {
  const apiMessage = error?.error?.message;
  if (Array.isArray(apiMessage)) {
    return apiMessage.join(', ');
  }
  return apiMessage || error?.message || fallback;
}

@Injectable()
export class OrganisationsEffects {
  constructor(
    private actions$: Actions,
    private organisationsService: OrganisationsService,
  ) {}

  fetchList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganisationsActions.fetchList),
      mergeMap(() =>
        this.organisationsService.getOrganisations().pipe(
          map((organisations) =>
            OrganisationsActions.fetchListSuccess({
              organisations: (organisations ?? []).map(normalizeOrganisation),
            }),
          ),
          catchError((error) =>
            of(
              OrganisationsActions.fetchListFailure({
                error: errorMessage(error, 'Failed to fetch organisations'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganisationsActions.fetchDetails),
      mergeMap(({ organisationId }) =>
        this.organisationsService.getOrganisation(organisationId).pipe(
          map((organisation) =>
            OrganisationsActions.fetchDetailsSuccess({
              organisation: normalizeOrganisation(organisation),
            }),
          ),
          catchError((error) =>
            of(
              OrganisationsActions.fetchDetailsFailure({
                error: errorMessage(error, 'Failed to fetch organisation'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createOrganisation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganisationsActions.createOrganisation),
      mergeMap(({ organisation }) =>
        this.organisationsService.createOrganisation(organisation).pipe(
          map((created) =>
            OrganisationsActions.createOrganisationSuccess({
              organisation: normalizeOrganisation(created),
            }),
          ),
          catchError((error) =>
            of(
              OrganisationsActions.createOrganisationFailure({
                error: errorMessage(error, 'Failed to create organisation'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateOrganisation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganisationsActions.updateOrganisation),
      mergeMap(({ organisationId, organisation }) =>
        this.organisationsService.updateOrganisation(organisationId, organisation).pipe(
          map((updated) =>
            OrganisationsActions.updateOrganisationSuccess({
              organisation: normalizeOrganisation(updated),
            }),
          ),
          catchError((error) =>
            of(
              OrganisationsActions.updateOrganisationFailure({
                error: errorMessage(error, 'Failed to update organisation'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteOrganisation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganisationsActions.deleteOrganisation),
      mergeMap(({ organisationId }) =>
        this.organisationsService.deleteOrganisation(organisationId).pipe(
          map(() => OrganisationsActions.deleteOrganisationSuccess({ organisationId })),
          catchError((error) =>
            of(
              OrganisationsActions.deleteOrganisationFailure({
                error: errorMessage(error, 'Failed to delete organisation'),
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
