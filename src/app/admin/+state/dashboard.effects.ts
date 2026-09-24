import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, forkJoin, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from './dashboard.service';
import { normalizeTrainerDashboardStats } from './dashboard.model';
import { selectOrganisationScope } from 'src/app/organisations/+state/organisations.selectors';

@Injectable()
export class DashboardEffects {
  constructor(
    private actions$: Actions,
    private dashboardService: DashboardService,
    private store: Store,
  ) {}

  fetchTrainerDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.fetchTrainerDashboard),
      withLatestFrom(this.store.select(selectOrganisationScope)),
      mergeMap(([, { isGlobalAdmin, organisationId }]) => {
        // Both dashboard endpoints are scoped to a single organisation - the
        // trainer's own, or whichever one a global admin has picked in the
        // organisation filter.
        if (organisationId == null) {
          return of(
            DashboardActions.fetchTrainerDashboardFailure({
              error: isGlobalAdmin
                ? 'Select an organisation to view its dashboard'
                : 'No organisation on the signed-in account',
            }),
          );
        }

        return forkJoin({
          overview: this.dashboardService.getOverview(organisationId),
          activity: this.dashboardService.getActivity(organisationId),
        }).pipe(
          map(({ overview, activity }) =>
            DashboardActions.fetchTrainerDashboardSuccess({
              stats: normalizeTrainerDashboardStats(overview, activity),
            }),
          ),
          catchError((error) =>
            of(
              DashboardActions.fetchTrainerDashboardFailure({
                error: error.message || 'Failed to fetch dashboard stats',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
