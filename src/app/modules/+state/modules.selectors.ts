import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ModulesState } from './modules.reducer';

export const selectModulesState =
  createFeatureSelector<ModulesState>('modules');
export const selectModuleList = createSelector(
  selectModulesState,
  (state) => state.moduleList,
);
export const selectModulesLoading = createSelector(
  selectModulesState,
  (state) => state.loading,
);
export const selectModulesError = createSelector(
  selectModulesState,
  (state) => state.error,
);
