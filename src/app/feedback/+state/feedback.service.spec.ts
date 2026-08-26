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
    scenarioContent: 'Fake Microsoft password reset email',
    decision: 'Safe',
    correct: false,
    correctAnswer: 'Suspicious',
    selectedCues: ['Urgent language'],
    missedCues: ['Mismatched sender domain'],
    attemptId: 'a_123',
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

  it('should POST the request payload to the feedback endpoint', () => {
    service.getFeedback(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({
      success: true,
      feedback: {
        id: 'f_001',
        attemptId: 'a_123',
        generatedBy: 'AI',
        content: 'Great job spotting the phishing attempt.',
      },
    });
  });
});
