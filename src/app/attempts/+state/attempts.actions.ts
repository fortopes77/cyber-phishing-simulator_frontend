import { createActionGroup, props } from '@ngrx/store';
import { ModuleAttempt, ScenarioAttemptInput, ScenarioAttemptResult } from './attempt.model';

export const AttemptsActions = createActionGroup({
  source: 'Attempts',
  events: {
    // POST /attempts { moduleId } - starts a new module attempt session,
    // reused for every scenario the learner answers in that module until
    // finalizeAttempt closes it out.
    startAttempt: props<{ moduleId: number }>(),
    startAttemptSuccess: props<{ attempt: ModuleAttempt }>(),
    startAttemptFailure: props<{ error: string }>(),
    // POST /attempts/{attemptId}/scenario-attempts - records and immediately
    // grades one scenario's answer within an in-progress module attempt.
    submitScenarioAttempt: props<{
      attemptId: number;
      scenarioAttempt: ScenarioAttemptInput;
    }>(),
    submitScenarioAttemptSuccess: props<{ result: ScenarioAttemptResult }>(),
    submitScenarioAttemptFailure: props<{ error: string }>(),
    // POST /results/attempts/{attemptId}/finalize - closes out a module
    // attempt once the learner has answered every scenario they're doing in
    // this session (or is leaving early with partial progress).
    finalizeAttempt: props<{ attemptId: number }>(),
    finalizeAttemptSuccess: props<{ attempt: ModuleAttempt }>(),
    finalizeAttemptFailure: props<{ error: string }>(),
  },
});
