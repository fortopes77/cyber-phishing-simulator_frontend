import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { environment } from 'src/environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET the trainer-dashboard overview endpoint for the given organisation', () => {
    service.getOverview(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}organisations/1/trainer-dashboard`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ totalLearners: 52 });
  });

  it('should GET the trainer-dashboard activity endpoint for the given organisation', () => {
    service.getActivity(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}organisations/1/trainer-dashboard/activity`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
