import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { FeedbackActions } from './feedback.actions';
import { FeedbackService } from './feedback.service';

@Injectable()
export class FeedbackEffects {
  constructor(
    private actions$: Actions,
    private feedbackService: FeedbackService,
  ) {}

  requestFeedback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeedbackActions.requestFeedback),
      mergeMap((action) =>
        this.feedbackService.getFeedback(action.request).pipe(
          map((response) =>
            FeedbackActions.requestFeedbackSuccess({
              feedback: response.feedback,
            }),
          ),
          catchError((error) =>
            of(
              FeedbackActions.requestFeedbackFailure({
                error: error.message || 'Failed to fetch feedback',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
