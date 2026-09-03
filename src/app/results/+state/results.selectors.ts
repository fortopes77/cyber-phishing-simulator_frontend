import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ResultsState } from './results.reducer';

export const selectResultsState =
  createFeatureSelector<ResultsState>('results');

export const selectMyResults = createSelector(
  selectResultsState,
  (state) => state.results,
);
export const selectResultsLoading = createSelector(
  selectResultsState,
  (state) => state.loading,
);
export const selectResultsError = createSelector(
  selectResultsState,
  (state) => state.error,
);
