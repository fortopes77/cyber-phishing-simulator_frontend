import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AttemptsState } from './attempts.reducer';

export const selectAttemptsState =
  createFeatureSelector<AttemptsState>('attempts');
export const selectCurrentAttempt = createSelector(
  selectAttemptsState,
  (state) => state.currentAttempt,
);
export const selectAttemptsLoading = createSelector(
  selectAttemptsState,
  (state) => state.loading,
);
export const selectAttemptsError = createSelector(
  selectAttemptsState,
  (state) => state.error,
);
