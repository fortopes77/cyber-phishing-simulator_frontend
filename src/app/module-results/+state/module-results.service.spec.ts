import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ModuleResultsService } from './module-results.service';
import { environment } from 'src/environments/environment.development';

describe('ModuleResultsService', () => {
  let service: ModuleResultsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ModuleResultsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET the module result by moduleId', () => {
    service.getModuleResult(3).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}module-results/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ moduleId: 3 });
  });
});
