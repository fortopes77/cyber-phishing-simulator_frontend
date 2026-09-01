import { createReducer, on } from '@ngrx/store';
import { ModuleResultsActions } from './module-results.actions';
import { ModuleResult } from './module-result.model';

export interface ModuleResultsState {
  result: ModuleResult | null;
  loading: boolean;
  error: string | null;
}

export const initialModuleResultsState: ModuleResultsState = {
  result: null,
  loading: false,
  error: null,
};

export const moduleResultsReducer = createReducer(
  initialModuleResultsState,
  on(ModuleResultsActions.fetchModuleResult, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ModuleResultsActions.fetchModuleResultSuccess, (state, { result }) => ({
    ...state,
    result,
    loading: false,
  })),
  on(ModuleResultsActions.fetchModuleResultFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
