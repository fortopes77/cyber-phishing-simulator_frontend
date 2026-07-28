import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ScenarioActions } from './scenario.actions';
import { ScenarioService } from './scenario.service';
import { Injectable } from '@angular/core';

@Injectable()
export class ScenarioEffects {
  constructor(
    private actions$: Actions,
    private scenarioService: ScenarioService,
  ) {}

  fetchScenarios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.fetchList),
      mergeMap(() =>
        this.scenarioService.getScenarios().pipe(
          map((list: any) =>
            ScenarioActions.fetchListSuccess({ scenarios: list }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.fetchListFailure({
                error: error.message || 'Failed to fetch scenarios',
              }),
            ),
          ),
        ),
      ),
    ),
  );
  fetchScenarioDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.fetchScenarioDetails),
      mergeMap((action) =>
        this.scenarioService.getScenarioDetails(action.scenarioId).pipe(
          map((scenario: any) =>
            ScenarioActions.fetchScenarioDetailsSuccess({ scenario }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.fetchScenarioDetailsFailure({
                error: error.message || 'Failed to fetch scenario details',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
