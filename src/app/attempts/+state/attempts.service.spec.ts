import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AttemptsService } from './attempts.service';
import { environment } from 'src/environments/environment';
import { ScenarioAttemptInput } from './attempt.model';

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

  it('should POST to start a new module attempt', () => {
    service.startAttempt(1).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}attempts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ moduleId: 1 });
    req.flush({ id: 1, moduleId: 1, status: 'IN_PROGRESS' });
  });

  it('should POST a scenario answer within an attempt', () => {
    const scenarioAttempt: ScenarioAttemptInput = {
      scenarioId: 1,
      moduleId: 1,
      attemptNumber: 1,
      response: 'Suspicious',
      timeTakenSeconds: 12,
      startedAt: '2026-09-02T00:21:00.000Z',
      completedAt: '2026-09-02T00:21:12.000Z',
      selectedCues: '',
    };

    service.submitScenarioAttempt(1, scenarioAttempt).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}attempts/1/scenario-attempts`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(scenarioAttempt);
    req.flush({ attemptId: 1, scenarioId: 1, isCorrect: true, score: 100 });
  });

  it('should POST to finalize an attempt', () => {
    service.finalizeAttempt(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}results/attempts/1/finalize`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 1, moduleId: 1, status: 'COMPLETED' });
  });
});
