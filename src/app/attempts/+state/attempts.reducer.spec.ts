import { attemptsReducer, initialAttemptsState } from './attempts.reducer';
import { AttemptsActions } from './attempts.actions';
import { ModuleAttempt } from './attempt.model';

describe('attemptsReducer', () => {
  const attempt: ModuleAttempt = {
    id: 1,
    moduleId: 2,
    status: 'IN_PROGRESS',
    totalScore: 0,
    maxPossibleScore: 0,
    percentageScore: 0,
    scenariosCompleted: 0,
    totalScenarios: 0,
    passed: false,
    completedAt: null,
  };

  const completedAttempt: ModuleAttempt = {
    ...attempt,
    status: 'COMPLETED',
    passed: true,
    completedAt: '2026-09-02T00:21:44.856Z',
  };

  it('should return the initial state', () => {
    const state = attemptsReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialAttemptsState);
  });

  it('should set loading true and clear any error on startAttempt', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, error: 'Previous failure' },
      AttemptsActions.startAttempt({ moduleId: 2 }),
    );
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('should store the attempt and clear loading on startAttemptSuccess', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, loading: true },
      AttemptsActions.startAttemptSuccess({ attempt }),
    );
    expect(state.currentAttempt).toEqual(attempt);
    expect(state.loading).toBeFalse();
  });

  it('should store the error and clear loading on startAttemptFailure', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, loading: true },
      AttemptsActions.startAttemptFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
    expect(state.loading).toBeFalse();
  });

  it('should store the error on submitScenarioAttemptFailure', () => {
    const state = attemptsReducer(
      initialAttemptsState,
      AttemptsActions.submitScenarioAttemptFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
  });

  it('should update currentAttempt on finalizeAttemptSuccess', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, currentAttempt: attempt },
      AttemptsActions.finalizeAttemptSuccess({ attempt: completedAttempt }),
    );
    expect(state.currentAttempt).toEqual(completedAttempt);
  });

  it('should store the error on finalizeAttemptFailure', () => {
    const state = attemptsReducer(
      initialAttemptsState,
      AttemptsActions.finalizeAttemptFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
  });
});
