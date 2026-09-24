import { feedbackReducer, initialFeedbackState } from './feedback.reducer';
import { FeedbackActions } from './feedback.actions';
import { Feedback } from './feedback.model';

describe('feedbackReducer', () => {
  const feedback: Feedback = {
    score: 100,
    content: 'Great job spotting this one.',
    tips: [],
    redFlagsMissed: [],
  };

  it('should return the initial state', () => {
    const state = feedbackReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialFeedbackState);
  });

  it('should set loading true on requestFeedback', () => {
    const state = feedbackReducer(
      initialFeedbackState,
      FeedbackActions.requestFeedback({
        request: { scenarioId: 1, scenarioContent: '', decision: 'Safe', correct: false },
      }),
    );
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('should store the feedback and clear loading on success', () => {
    const state = feedbackReducer(
      { ...initialFeedbackState, loading: true },
      FeedbackActions.requestFeedbackSuccess({ feedback }),
    );
    expect(state.feedback).toEqual(feedback);
    expect(state.loading).toBeFalse();
  });

  it('should store the error and clear loading on failure', () => {
    const state = feedbackReducer(
      { ...initialFeedbackState, loading: true },
      FeedbackActions.requestFeedbackFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
    expect(state.loading).toBeFalse();
  });

  it('should clear feedback and error on clearFeedback', () => {
    const state = feedbackReducer(
      { feedback, loading: false, error: 'Failed' },
      FeedbackActions.clearFeedback(),
    );
    expect(state.feedback).toBeNull();
    expect(state.error).toBeNull();
  });
});
