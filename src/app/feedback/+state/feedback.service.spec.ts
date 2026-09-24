import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FeedbackService } from './feedback.service';
import { environment } from 'src/environments/environment';
import { FeedbackRequest } from './feedback.model';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let httpMock: HttpTestingController;

  const request: FeedbackRequest = {
    scenarioId: 7,
    scenarioContent: 'Fake Microsoft password reset email',
    decision: 'Safe',
    correct: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeedbackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST the AI-shaped request to the AI API feedback endpoint', () => {
    service.getFeedback(request).subscribe();

    const req = httpMock.expectOne(`${environment.aiApiUrl}feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      scenario_content: 'Fake Microsoft password reset email',
      scenarioChoices: [
        { id: 1, text: 'Suspicious', isCorrect: true, scenarioId: 7 },
        { id: 2, text: 'Safe', isCorrect: false, scenarioId: 7 },
      ],
      selectedChoiceId: 2,
    });
    req.flush({
      score: 0,
      explanation: 'This was a phishing attempt.',
      tips: [],
      redFlagsMissed: [],
    });
  });
});
