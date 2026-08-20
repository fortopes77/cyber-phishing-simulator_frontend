import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { AttemptsActions } from './attempts.actions';
import { AttemptsService } from './attempts.service';
import { Attempt } from './attempt.model';

@Injectable()
export class AttemptsEffects {
  constructor(
    private actions$: Actions,
    private attemptsService: AttemptsService,
  ) {}

  fetchUserAttempts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttemptsActions.fetchUserAttempts),
      mergeMap(() =>
        this.attemptsService.getUserAttempts().pipe(
          map((response: { attempts: Attempt[] } | Attempt[]) =>
            AttemptsActions.fetchUserAttemptsSuccess({
              attempts: Array.isArray(response)
                ? response
                : response.attempts,
            }),
          ),
          catchError((error) =>
            of(
              AttemptsActions.fetchUserAttemptsFailure({
                error: error.message || 'Failed to fetch attempts',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createAttempt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttemptsActions.createAttempt),
      mergeMap((action) =>
        this.attemptsService.createAttempt(action.attempt).pipe(
          map((response) =>
            AttemptsActions.createAttemptSuccess({
              attempt: response.attempt,
            }),
          ),
          catchError((error) =>
            of(
              AttemptsActions.createAttemptFailure({
                error: error.message || 'Failed to create attempt',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
