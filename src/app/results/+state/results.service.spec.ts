import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ResultsService } from './results.service';
import { environment } from 'src/environments/environment';

describe('ResultsService', () => {
  let service: ResultsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResultsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET the self-scoped results endpoint', () => {
    service.getMyResults().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}results/me`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it("should GET one module's results via the moduleId filter", () => {
    service.getMyModuleResult(7).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}results/me?moduleId=7`);
    expect(req.request.method).toBe('GET');
    req.flush({ moduleResults: [], scenarioResults: [] });
  });
});
