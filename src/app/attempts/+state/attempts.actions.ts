import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Attempt } from './attempt.model';

export const AttemptsActions = createActionGroup({
  source: 'Attempts',
  events: {
    fetchUserAttempts: emptyProps(),
    fetchUserAttemptsSuccess: props<{ attempts: Attempt[] }>(),
    fetchUserAttemptsFailure: props<{ error: string }>(),
    createAttempt: props<{ attempt: Partial<Attempt> }>(),
    createAttemptSuccess: props<{ attempt: Attempt }>(),
    createAttemptFailure: props<{ error: string }>(),
  },
});
