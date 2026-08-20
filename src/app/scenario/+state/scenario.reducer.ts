import { createReducer, on } from '@ngrx/store';
import { ScenarioActions } from './scenario.actions';

export interface ScenarioState {
  scenarioList: any[];
  scenario: any | null;
  loading: boolean;
  error: string | null;
}

export const initialScenarioState: ScenarioState = {
  scenarioList: [],
  scenario: null,
  loading: false,
  error: null,
};

export const scenarioReducer = createReducer(
  initialScenarioState,
  on(ScenarioActions.fetchList, (state) => ({
    ...state,
    loading: true,
  })),
  on(ScenarioActions.fetchListSuccess, (state, { scenarios }) => ({
    ...state,
    scenarioList: scenarios,
    loading: false,
  })),
  on(ScenarioActions.fetchListFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ScenarioActions.fetchScenariosByModule, (state) => ({
    ...state,
    loading: true,
  })),
  on(ScenarioActions.fetchScenariosByModuleSuccess, (state, { scenarios }) => ({
    ...state,
    scenarioList: scenarios,
    loading: false,
  })),
  on(ScenarioActions.fetchScenariosByModuleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ScenarioActions.fetchScenarioDetails, (state) => ({
    ...state,
    loading: true,
  })),
  on(ScenarioActions.fetchScenarioDetailsSuccess, (state, { scenario }) => ({
    ...state,
    scenario,
    loading: false,
  })),
  on(ScenarioActions.fetchScenarioDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
