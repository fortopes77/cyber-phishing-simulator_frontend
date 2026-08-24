import { attemptsReducer, initialAttemptsState } from './attempts.reducer';
import { AttemptsActions } from './attempts.actions';
import { Attempt } from './attempt.model';

describe('attemptsReducer', () => {
  const attempt: Attempt = {
    id: 'a1',
    scenarioId: 's_001',
    decision: 'Report',
    correct: true,
  };

  it('should return the initial state', () => {
    const state = attemptsReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialAttemptsState);
  });

  it('should set loading true on fetchUserAttempts', () => {
    const state = attemptsReducer(
      initialAttemptsState,
      AttemptsActions.fetchUserAttempts(),
    );
    expect(state.loading).toBeTrue();
  });

  it('should store attempts and clear loading on fetch success', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, loading: true },
      AttemptsActions.fetchUserAttemptsSuccess({ attempts: [attempt] }),
    );
    expect(state.attempts).toEqual([attempt]);
    expect(state.loading).toBeFalse();
  });

  it('should store the error and clear loading on fetch failure', () => {
    const state = attemptsReducer(
      { ...initialAttemptsState, loading: true },
      AttemptsActions.fetchUserAttemptsFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
    expect(state.loading).toBeFalse();
  });

  it('should append the new attempt on createAttemptSuccess', () => {
    const state = attemptsReducer(
      initialAttemptsState,
      AttemptsActions.createAttemptSuccess({ attempt }),
    );
    expect(state.attempts).toEqual([attempt]);
  });
});
