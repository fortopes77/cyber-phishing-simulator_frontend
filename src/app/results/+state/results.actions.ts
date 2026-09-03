import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LearnerResults } from './results.model';

export const ResultsActions = createActionGroup({
  source: 'Results',
  events: {
    // Self-scoped via the JWT (GET /results/me) - no userId needed.
    fetchMyResults: emptyProps(),
    fetchMyResultsSuccess: props<{ results: LearnerResults }>(),
    fetchMyResultsFailure: props<{ error: string }>(),
  },
});
