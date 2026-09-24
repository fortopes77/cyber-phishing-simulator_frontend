import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LearnerResults } from './results.model';

export const ResultsActions = createActionGroup({
  source: 'Results',
  events: {
    // Self-scoped via the JWT (GET /results/me) - no userId needed.
    fetchMyResults: emptyProps(),
    fetchMyResultsSuccess: props<{ results: LearnerResults }>(),
    fetchMyResultsFailure: props<{ error: string }>(),
    // One module's results for the module result screen - GET
    // /results/me?moduleId=X, the learner-facing module result detail (GET
    // /results/module/:id is trainer/admin only). Kept in its own slice so
    // screens reading the learner's full results never see a filtered copy.
    fetchModuleResult: props<{ moduleId: number }>(),
    fetchModuleResultSuccess: props<{ moduleId: number; results: LearnerResults }>(),
    fetchModuleResultFailure: props<{ error: string }>(),
  },
});
