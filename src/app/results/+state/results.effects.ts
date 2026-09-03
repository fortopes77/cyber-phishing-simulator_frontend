import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ResultsActions } from './results.actions';
import { ResultsService } from './results.service';
import { normalizeLearnerResults } from './results.model';

@Injectable()
export class ResultsEffects {
  constructor(
    private actions$: Actions,
    private resultsService: ResultsService,
  ) {}

  fetchMyResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResultsActions.fetchMyResults),
      mergeMap(() =>
        this.resultsService.getMyResults().pipe(
          map((raw) =>
            ResultsActions.fetchMyResultsSuccess({
              results: normalizeLearnerResults(raw),
            }),
          ),
          catchError((error) =>
            of(
              ResultsActions.fetchMyResultsFailure({
                error: error.message || 'Failed to fetch results',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
