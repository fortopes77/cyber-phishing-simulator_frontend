import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Feedback, FeedbackRequest } from './feedback.model';

export const FeedbackActions = createActionGroup({
  source: 'Feedback',
  events: {
    requestFeedback: props<{ request: FeedbackRequest }>(),
    requestFeedbackSuccess: props<{ feedback: Feedback }>(),
    requestFeedbackFailure: props<{ error: string }>(),
    clearFeedback: emptyProps(),
  },
});
