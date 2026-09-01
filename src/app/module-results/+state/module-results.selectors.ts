import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ModuleResultsState } from './module-results.reducer';

export const selectModuleResultsState =
  createFeatureSelector<ModuleResultsState>('moduleResults');
export const selectModuleResult = createSelector(
  selectModuleResultsState,
  (state) => state.result,
);
export const selectModuleResultLoading = createSelector(
  selectModuleResultsState,
  (state) => state.loading,
);
export const selectModuleResultError = createSelector(
  selectModuleResultsState,
  (state) => state.error,
);
