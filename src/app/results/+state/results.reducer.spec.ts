import { resultsReducer, initialResultsState } from './results.reducer';
import { ResultsActions } from './results.actions';
import { LearnerResults } from './results.model';

describe('resultsReducer', () => {
  const results: LearnerResults = {
    scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
    averageScore: 80,
  };

  it('should return the initial state', () => {
    const state = resultsReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialResultsState);
  });

  it('should set loading true and clear any error on fetchMyResults', () => {
    const state = resultsReducer(
      { ...initialResultsState, error: 'Previous failure' },
      ResultsActions.fetchMyResults(),
    );
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('should store the results and clear loading on success', () => {
    const state = resultsReducer(
      { ...initialResultsState, loading: true },
      ResultsActions.fetchMyResultsSuccess({ results }),
    );
    expect(state.results).toEqual(results);
    expect(state.loading).toBeFalse();
  });

  it('should store the error and clear loading on failure', () => {
    const state = resultsReducer(
      { ...initialResultsState, loading: true },
      ResultsActions.fetchMyResultsFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
    expect(state.loading).toBeFalse();
  });
});
