import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AttemptsState } from './attempts.reducer';

export const selectAttemptsState =
  createFeatureSelector<AttemptsState>('attempts');
export const selectAttempts = createSelector(
  selectAttemptsState,
  (state) => state.attempts,
);
export const selectAttemptsLoading = createSelector(
  selectAttemptsState,
  (state) => state.loading,
);
export const selectAttemptsError = createSelector(
  selectAttemptsState,
  (state) => state.error,
);
