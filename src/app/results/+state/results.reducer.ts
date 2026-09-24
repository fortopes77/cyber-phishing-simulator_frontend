import { createReducer, on } from '@ngrx/store';
import { ResultsActions } from './results.actions';
import { LearnerResults } from './results.model';

export interface ResultsState {
  results: LearnerResults | null;
  // GET /results/me?moduleId=X, tagged with the module it was fetched for.
  moduleResult: { moduleId: number; results: LearnerResults } | null;
  loading: boolean;
  error: string | null;
}

export const initialResultsState: ResultsState = {
  results: null,
  moduleResult: null,
  loading: false,
  error: null,
};

export const resultsReducer = createReducer(
  initialResultsState,
  on(ResultsActions.fetchMyResults, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ResultsActions.fetchMyResultsSuccess, (state, { results }) => ({
    ...state,
    results,
    loading: false,
  })),
  on(ResultsActions.fetchMyResultsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ResultsActions.fetchModuleResult, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ResultsActions.fetchModuleResultSuccess, (state, { moduleId, results }) => ({
    ...state,
    moduleResult: { moduleId, results },
    loading: false,
  })),
  on(ResultsActions.fetchModuleResultFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
