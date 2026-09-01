import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ModuleResultsActions } from './module-results.actions';
import { ModuleResultsService } from './module-results.service';
import { normalizeModuleResult } from './module-result.model';

@Injectable()
export class ModuleResultsEffects {
  constructor(
    private actions$: Actions,
    private moduleResultsService: ModuleResultsService,
  ) {}

  fetchModuleResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModuleResultsActions.fetchModuleResult),
      mergeMap((action) =>
        this.moduleResultsService.getModuleResult(action.moduleId).pipe(
          map((response) =>
            ModuleResultsActions.fetchModuleResultSuccess({
              result: normalizeModuleResult(response),
            }),
          ),
          catchError((error) =>
            of(
              ModuleResultsActions.fetchModuleResultFailure({
                error: error.message || 'Failed to fetch module results',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
