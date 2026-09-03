import { createReducer, on } from '@ngrx/store';
import { ResultsActions } from './results.actions';
import { LearnerResults } from './results.model';

export interface ResultsState {
  results: LearnerResults | null;
  loading: boolean;
  error: string | null;
}

export const initialResultsState: ResultsState = {
  results: null,
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
);
