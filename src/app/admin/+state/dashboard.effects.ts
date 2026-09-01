import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, forkJoin, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from './dashboard.service';
import { normalizeTrainerDashboardStats } from './dashboard.model';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';

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
      withLatestFrom(this.store.select(selectAuthState)),
      mergeMap(([, auth]) => {
        // Both dashboard endpoints are scoped to an organisation - read it
        // off the signed-in trainer's own account.
        const organisationId = auth.user?.organisationId;
        if (organisationId == null) {
          return of(
            DashboardActions.fetchTrainerDashboardFailure({
              error: 'No organisation on the signed-in account',
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
