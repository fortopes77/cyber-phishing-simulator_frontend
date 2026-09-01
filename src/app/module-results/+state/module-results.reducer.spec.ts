import { moduleResultsReducer, initialModuleResultsState } from './module-results.reducer';
import { ModuleResultsActions } from './module-results.actions';
import { ModuleResult } from './module-result.model';

describe('moduleResultsReducer', () => {
  const result: ModuleResult = {
    moduleId: 1,
    moduleName: 'Email Phishing Basics',
    totalScore: 2,
    maxScore: 2,
    percentageScore: 100,
    passingScore: 70,
    passed: true,
    scenarioResults: [],
  };

  it('should return the initial state', () => {
    const state = moduleResultsReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialModuleResultsState);
  });

  it('should set loading true and clear any prior error on fetchModuleResult', () => {
    const state = moduleResultsReducer(
      { ...initialModuleResultsState, error: 'stale error' },
      ModuleResultsActions.fetchModuleResult({ moduleId: 1 }),
    );
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('should store the result on fetchModuleResultSuccess', () => {
    const state = moduleResultsReducer(
      { ...initialModuleResultsState, loading: true },
      ModuleResultsActions.fetchModuleResultSuccess({ result }),
    );
    expect(state.result).toEqual(result);
    expect(state.loading).toBeFalse();
  });

  it('should store the error on fetchModuleResultFailure', () => {
    const state = moduleResultsReducer(
      { ...initialModuleResultsState, loading: true },
      ModuleResultsActions.fetchModuleResultFailure({ error: 'Not found' }),
    );
    expect(state.error).toBe('Not found');
    expect(state.loading).toBeFalse();
  });
});
