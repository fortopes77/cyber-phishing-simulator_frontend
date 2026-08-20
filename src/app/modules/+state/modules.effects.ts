import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ModulesActions } from './modules.actions';
import { ModulesService } from './modules.service';
import { LearnerModule } from './module.model';

@Injectable()
export class ModulesEffects {
  constructor(
    private actions$: Actions,
    private modulesService: ModulesService,
  ) {}

  fetchModules$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.fetchList),
      mergeMap(() =>
        this.modulesService.getModules().pipe(
          map((response: LearnerModule[] | { modules: LearnerModule[] }) =>
            ModulesActions.fetchListSuccess({
              modules: Array.isArray(response)
                ? response
                : response.modules,
            }),
          ),
          catchError((error) =>
            of(
              ModulesActions.fetchListFailure({
                error: error.message || 'Failed to fetch modules',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
