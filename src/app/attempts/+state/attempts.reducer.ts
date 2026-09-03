import { createReducer, on } from '@ngrx/store';
import { AttemptsActions } from './attempts.actions';
import { ModuleAttempt } from './attempt.model';

export interface AttemptsState {
  // The in-progress (or last-finalized) module attempt for the current
  // scenario-answering session. There's no "resume across a page refresh"
  // support - a fresh visit starts a fresh attempt.
  currentAttempt: ModuleAttempt | null;
  loading: boolean;
  error: string | null;
}

export const initialAttemptsState: AttemptsState = {
  currentAttempt: null,
  loading: false,
  error: null,
};

export const attemptsReducer = createReducer(
  initialAttemptsState,
  on(AttemptsActions.startAttempt, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AttemptsActions.startAttemptSuccess, (state, { attempt }) => ({
    ...state,
    currentAttempt: attempt,
    loading: false,
  })),
  on(AttemptsActions.startAttemptFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AttemptsActions.submitScenarioAttemptFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(AttemptsActions.finalizeAttemptSuccess, (state, { attempt }) => ({
    ...state,
    currentAttempt: attempt,
  })),
  on(AttemptsActions.finalizeAttemptFailure, (state, { error }) => ({
    ...state,
    error,
  })),
);
