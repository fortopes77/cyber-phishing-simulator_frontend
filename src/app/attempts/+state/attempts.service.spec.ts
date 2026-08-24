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
    localStorage.removeItem('auth');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttemptsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('auth');
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

  it('should attach the Authorization header when a token is stored', () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'abc123' }));

    service.getUserAttempts().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}attempts`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({ attempts: [] });
  });
});
