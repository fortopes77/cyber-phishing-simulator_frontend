import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { AttemptsActions } from './attempts.actions';
import { AttemptsService } from './attempts.service';
import { normalizeModuleAttempt, normalizeScenarioAttemptResult } from './attempt.model';

@Injectable()
export class AttemptsEffects {
  constructor(
    private actions$: Actions,
    private attemptsService: AttemptsService,
  ) {}

  startAttempt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttemptsActions.startAttempt),
      mergeMap((action) =>
        this.attemptsService.startAttempt(action.moduleId).pipe(
          map((raw) =>
            AttemptsActions.startAttemptSuccess({
              attempt: normalizeModuleAttempt(raw),
            }),
          ),
          catchError((error) =>
            of(
              AttemptsActions.startAttemptFailure({
                error: error.message || 'Failed to start attempt',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  submitScenarioAttempt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttemptsActions.submitScenarioAttempt),
      mergeMap((action) =>
        this.attemptsService
          .submitScenarioAttempt(action.attemptId, action.scenarioAttempt)
          .pipe(
            map((raw) =>
              AttemptsActions.submitScenarioAttemptSuccess({
                result: normalizeScenarioAttemptResult(raw),
              }),
            ),
            catchError((error) =>
              of(
                AttemptsActions.submitScenarioAttemptFailure({
                  error: error.message || 'Failed to submit scenario attempt',
                }),
              ),
            ),
          ),
      ),
    ),
  );

  finalizeAttempt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttemptsActions.finalizeAttempt),
      mergeMap((action) =>
        this.attemptsService.finalizeAttempt(action.attemptId).pipe(
          map((raw) =>
            AttemptsActions.finalizeAttemptSuccess({
              attempt: normalizeModuleAttempt(raw),
            }),
          ),
          catchError((error) =>
            of(
              AttemptsActions.finalizeAttemptFailure({
                error: error.message || 'Failed to finalize attempt',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
