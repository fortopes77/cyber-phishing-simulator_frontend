import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ScenarioService } from './scenario.service';
import { environment } from 'src/environments/environment';
import { ScenarioCategory, ScenarioDifficulty } from '../models/scenario.model';

describe('ScenarioService', () => {
  let service: ScenarioService;
  let httpMock: HttpTestingController;
  const apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ScenarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST the normalized Create payload to scenarios', () => {
    service
      .createScenario({
        moduleId: 3,
        title: 'Suspicious Invoice Email',
        scenarioDescription:
          'Learner must identify red flags in a fake invoice email.',
        content: 'Dear customer, your invoice #4471 is overdue...',
        category: 'phishing',
        difficulty: 'Medium',
        interactionType: 'Email',
        correctAnswer: 'suspicious',
      })
      .subscribe();

    const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      moduleId: 3,
      title: 'Suspicious Invoice Email',
      scenarioDescription:
        'Learner must identify red flags in a fake invoice email.',
      content: 'Dear customer, your invoice #4471 is overdue...',
      category: ScenarioCategory.Phishing,
      difficulty: ScenarioDifficulty.Medium,
      interactionType: 'EMAIL',
      correctAnswer: 'suspicious',
    });
    req.flush({});
  });

  it('should PATCH the normalized Update payload to scenarios/:id', () => {
    service
      .updateScenario('7', {
        moduleId: 3,
        title: 'Suspicious Invoice Email Updated',
        category: 'phishing',
        difficulty: 'Medium',
        interactionType: 'Email',
        correctCues: ['Dear customer', 'invoice #4471'],
      })
      .subscribe();

    const req = httpMock.expectOne(`${apiEndpoint}scenarios/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.title).toBe('Suspicious Invoice Email Updated');
    expect(req.request.body.correctCues).toEqual([
      'Dear customer',
      'invoice #4471',
    ]);
    expect(req.request.body.correctAnswer).toBeUndefined();
    req.flush({});
  });

  it('should DELETE scenarios/:id', () => {
    service.deleteScenario('7').subscribe();

    const req = httpMock.expectOne(`${apiEndpoint}scenarios/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Scenario deleted successfully' });
  });
});
