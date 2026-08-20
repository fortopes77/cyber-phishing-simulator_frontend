import { createReducer, on } from '@ngrx/store';
import { AttemptsActions } from './attempts.actions';
import { Attempt } from './attempt.model';

export interface AttemptsState {
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
}

export const initialAttemptsState: AttemptsState = {
  attempts: [],
  loading: false,
  error: null,
};

export const attemptsReducer = createReducer(
  initialAttemptsState,
  on(AttemptsActions.fetchUserAttempts, (state) => ({
    ...state,
    loading: true,
  })),
  on(AttemptsActions.fetchUserAttemptsSuccess, (state, { attempts }) => ({
    ...state,
    attempts,
    loading: false,
  })),
  on(AttemptsActions.fetchUserAttemptsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AttemptsActions.createAttemptSuccess, (state, { attempt }) => ({
    ...state,
    attempts: [...state.attempts, attempt],
  })),
);
