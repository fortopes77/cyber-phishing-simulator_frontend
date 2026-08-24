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
    scenario_content: 'Fake Microsoft password reset email',
    scenarioChoices: [
      { id: 1, text: 'Clicked the link', isCorrect: false, scenarioId: 's_001' },
      { id: 2, text: 'Reported the email', isCorrect: true, scenarioId: 's_001' },
    ],
    selectedChoiceId: 1,
    attemptId: 'a_123',
  };

  beforeEach(() => {
    localStorage.removeItem('auth');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeedbackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('auth');
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

  it('should attach the Authorization header when a token is stored', () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'abc123' }));

    service.getFeedback(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}feedback`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({ success: true, feedback: {} });
  });
});
