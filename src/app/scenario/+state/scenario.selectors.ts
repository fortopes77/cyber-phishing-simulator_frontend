import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScenarioState } from './scenario.reducer';

export const selectScenarioState =
  createFeatureSelector<ScenarioState>('scenario');
export const selectScenarioList = createSelector(
  selectScenarioState,
  (state) => state.scenarioList,
);
export const selectScenario = createSelector(
  selectScenarioState,
  (state) => state.scenario,
);
export const selectScenarioLoading = createSelector(
  selectScenarioState,
  (state) => state.loading,
);
export const selectScenarioError = createSelector(
  selectScenarioState,
  (state) => state.error,
);
