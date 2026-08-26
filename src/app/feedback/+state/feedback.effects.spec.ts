import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { FeedbackEffects } from './feedback.effects';
import { FeedbackActions } from './feedback.actions';
import { FeedbackService } from './feedback.service';
import { FeedbackRequest } from './feedback.model';

describe('FeedbackEffects', () => {
  let effects: FeedbackEffects;
  let actions$: Observable<any>;
  let feedbackService: jasmine.SpyObj<FeedbackService>;

  const request: FeedbackRequest = {
    scenarioContent: 'content',
    decision: 'Safe',
    correct: false,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('FeedbackService', ['getFeedback']);

    TestBed.configureTestingModule({
      providers: [
        FeedbackEffects,
        provideMockActions(() => actions$),
        { provide: FeedbackService, useValue: spy },
      ],
    });

    effects = TestBed.inject(FeedbackEffects);
    feedbackService = TestBed.inject(
      FeedbackService,
    ) as jasmine.SpyObj<FeedbackService>;
  });

  it('should dispatch requestFeedbackSuccess on successful fetch', (done) => {
    const feedback = {
      id: 'f_001',
      attemptId: 'a_123',
      generatedBy: 'AI',
      content: 'Nice work.',
    };
    feedbackService.getFeedback.and.returnValue(
      of({ success: true, feedback }),
    );
    actions$ = of(FeedbackActions.requestFeedback({ request }));

    effects.requestFeedback$.subscribe((action) => {
      expect(action).toEqual(
        FeedbackActions.requestFeedbackSuccess({ feedback }),
      );
      done();
    });
  });

  it('should dispatch requestFeedbackFailure on error', (done) => {
    feedbackService.getFeedback.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(FeedbackActions.requestFeedback({ request }));

    effects.requestFeedback$.subscribe((action) => {
      expect(action).toEqual(
        FeedbackActions.requestFeedbackFailure({ error: 'Network error' }),
      );
      done();
    });
  });
});
