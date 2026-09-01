import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { environment } from 'src/environments/environment';
import { TrainerDashboardStats } from './dashboard.model';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const stats: TrainerDashboardStats = {
    totalLearners: 52,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [],
    recentActivity: [],
  };

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

  it('should GET the trainer dashboard endpoint', () => {
    service.getTrainerDashboard().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}trainer/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });
});
