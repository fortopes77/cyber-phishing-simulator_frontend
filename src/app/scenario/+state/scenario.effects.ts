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
  fetchScenariosByModule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.fetchScenariosByModule),
      mergeMap((action) =>
        this.scenarioService.getScenariosByModule(action.moduleId).pipe(
          map((list: any) =>
            ScenarioActions.fetchScenariosByModuleSuccess({
              scenarios: Array.isArray(list) ? list : (list?.scenarios ?? []),
            }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.fetchScenariosByModuleFailure({
                error: error.message || 'Failed to fetch module scenarios',
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
  createAIScenario$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.createAIScenario),
      mergeMap(() =>
        this.scenarioService.createScenarioWithAI().pipe(
          map((scenario: any) =>
            ScenarioActions.createAIScenarioSuccess({ scenario }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.createAIScenarioFailure({
                error: error.message || 'Failed to create scenario',
              }),
            ),
          ),
        ),
      ),
    ),
  );
  createScenario$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.createScenario),
      mergeMap((action) =>
        this.scenarioService.createScenario(action.scenario).pipe(
          map((scenario: any) =>
            ScenarioActions.createScenarioSuccess({ scenario }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.createScenarioFailure({
                error: error.message || 'Failed to create scenario',
              }),
            ),
          ),
        ),
      ),
    ),
  );
  updateScenario$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.updateScenario),
      mergeMap((action) =>
        this.scenarioService
          .updateScenario(action.scenarioId, action.updatedScenario)
          .pipe(
            map((scenario: any) =>
              ScenarioActions.updateScenarioSuccess({ scenario }),
            ),
            catchError((error) =>
              of(
                ScenarioActions.updateScenarioFailure({
                  error: error.message || 'Failed to update scenario',
                }),
              ),
            ),
          ),
      ),
    ),
  );
  deleteScenario$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenarioActions.deleteScenario),
      mergeMap((action) =>
        this.scenarioService.deleteScenario(action.scenarioId).pipe(
          map(() =>
            ScenarioActions.deleteScenarioSuccess({
              scenarioId: action.scenarioId,
            }),
          ),
          catchError((error) =>
            of(
              ScenarioActions.deleteScenarioFailure({
                error: error.message || 'Failed to delete scenario',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
