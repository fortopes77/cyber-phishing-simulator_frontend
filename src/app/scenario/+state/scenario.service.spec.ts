import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ScenarioService } from './scenario.service';
import { environment } from 'src/environments/environment';

describe('ScenarioService', () => {
  let service: ScenarioService;
  let httpMock: HttpTestingController;

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

  describe('createScenario', () => {
    const apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

    it('should uppercase a matching category and difficulty', () => {
      service
        .createScenario({ category: 'phishing', difficulty: 'easy' })
        .subscribe();

      const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req.request.body.category).toBe('PHISHING');
      expect(req.request.body.difficulty).toBe('EASY');
      req.flush({});
    });

    it('should map category aliases onto the backend enum, typos included', () => {
      service
        .createScenario({
          category: 'Business Email Compromise',
          difficulty: 'medium',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req.request.body.category).toBe('BUISINESS_EMAIL_COMPROMISE');
      req.flush({});

      service
        .createScenario({ category: 'ransomware', difficulty: 'hard' })
        .subscribe();

      const req2 = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req2.request.body.category).toBe('RANSONWARE');
      req2.flush({});
    });

    it('should fall back to a safe default for an unrecognised category or difficulty', () => {
      service
        .createScenario({ category: 'Training', difficulty: 'nightmare' })
        .subscribe();

      const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req.request.body.category).toBe('PHISHING');
      expect(req.request.body.difficulty).toBe('MEDIUM');
      req.flush({});
    });

    it('should rewrite sender and recipient onto the approved fake domain, keeping the local part', () => {
      service
        .createScenario({
          sender: 'alerts@microsoft.com',
          recipient: 'jane.doe@realcompany.com',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req.request.body.sender).toBe('alerts@trulyfake.com');
      expect(req.request.body.recipient).toBe('jane.doe@trulyfake.com');
      req.flush({});
    });

    it('should generate a fallback local part when sender/recipient are missing', () => {
      service.createScenario({}).subscribe();

      const req = httpMock.expectOne(`${apiEndpoint}scenarios`);
      expect(req.request.body.sender).toBe('it-support@trulyfake.com');
      expect(req.request.body.recipient).toBe('employee@trulyfake.com');
      req.flush({});
    });
  });
});
