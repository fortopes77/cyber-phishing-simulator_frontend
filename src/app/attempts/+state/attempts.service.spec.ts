import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AttemptsService } from './attempts.service';
import { environment } from 'src/environments/environment.development';

describe('AttemptsService', () => {
  let service: AttemptsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttemptsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET the current user attempts', () => {
    service.getUserAttempts().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}attempts`);
    expect(req.request.method).toBe('GET');
    req.flush({ attempts: [] });
  });

  it('should POST a new attempt', () => {
    const attempt = { scenarioId: 's_001', decision: 'Report' };

    service.createAttempt(attempt).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}attempts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(attempt);
    req.flush({
      success: true,
      attempt: { id: 'a_1', scenarioId: 's_001', decision: 'Report', correct: true },
    });
  });
});
