import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from './dashboard.service';

@Injectable()
export class DashboardEffects {
  constructor(
    private actions$: Actions,
    private dashboardService: DashboardService,
  ) {}

  fetchTrainerDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.fetchTrainerDashboard),
      mergeMap(() =>
        this.dashboardService.getTrainerDashboard().pipe(
          map((response) =>
            DashboardActions.fetchTrainerDashboardSuccess({
              stats: 'stats' in response ? response.stats : response,
            }),
          ),
          catchError((error) =>
            of(
              DashboardActions.fetchTrainerDashboardFailure({
                error: error.message || 'Failed to fetch dashboard stats',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
