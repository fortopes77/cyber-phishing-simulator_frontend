import { createReducer, on } from '@ngrx/store';
import { FeedbackActions } from './feedback.actions';
import { Feedback } from './feedback.model';

export interface FeedbackState {
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
}

export const initialFeedbackState: FeedbackState = {
  feedback: null,
  loading: false,
  error: null,
};

export const feedbackReducer = createReducer(
  initialFeedbackState,
  on(FeedbackActions.requestFeedback, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FeedbackActions.requestFeedbackSuccess, (state, { feedback }) => ({
    ...state,
    feedback,
    loading: false,
  })),
  on(FeedbackActions.requestFeedbackFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(FeedbackActions.clearFeedback, (state) => ({
    ...state,
    feedback: null,
    error: null,
  })),
);
