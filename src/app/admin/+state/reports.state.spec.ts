import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReportsService } from './reports.service';
import { ReportsEffects } from './reports.effects';
import { ReportsActions } from './reports.actions';
import { initialReportsState, reportsReducer } from './reports.reducer';
import {
  normalizeLearnerReportRows,
  normalizeModuleReportDetail,
  normalizeReportOverview,
  toReportDateRange,
} from './reports.model';

describe('reports model', () => {
  it('should read the overview as the live API returns it', () => {
    expect(
      normalizeReportOverview({
        totalUsers: 3,
        modulesAssignedCount: 5,
        completionRate: 23.1,
        averageScore: 83.3,
      }),
    ).toEqual({ totalUsers: 3, modulesAssignedCount: 5, completionRate: 23.1, averageScore: 83.3 });
  });

  it("should also accept the Swagger schema's countModulesAssigned name", () => {
    expect(normalizeReportOverview({ countModulesAssigned: 7 }).modulesAssignedCount).toBe(7);
  });

  it('should default missing numbers to 0', () => {
    expect(normalizeReportOverview({})).toEqual({
      totalUsers: 0,
      modulesAssignedCount: 0,
      completionRate: 0,
      averageScore: 0,
    });
    expect(normalizeModuleReportDetail({}).statusBreakdown).toEqual({
      notStarted: 0,
      inProgress: 0,
      completed: 0,
    });
  });

  it('should unwrap the users envelope', () => {
    expect(
      normalizeLearnerReportRows({
        users: [{ userId: 4, username: 'Mystery', completionRate: 60, averageScore: 83.3, atRisk: false }],
      }),
    ).toEqual([{ userId: 4, username: 'Mystery', completionRate: 60, averageScore: 83.3, atRisk: false }]);
  });

  it('should only send the date bounds that are set', () => {
    const start = new Date('2026-09-20T00:00:00.000Z');

    expect(toReportDateRange(null, null)).toEqual({});
    expect(toReportDateRange(start, null)).toEqual({ startDate: '2026-09-20T00:00:00.000Z' });
  });
});

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}organisations/1/reports`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should send the date range to the overview endpoint', () => {
    service.getOverview(1, { startDate: 'a', endDate: 'b' }).subscribe();

    httpMock.expectOne(`${base}/overview?startDate=a&endDate=b`).flush({});
  });

  it('should add the learner status filter only when set', () => {
    service.getLearners(1, {}, null).subscribe();
    service.getLearners(1, {}, 'completed').subscribe();

    httpMock.expectOne(`${base}/users`).flush({ users: [] });
    httpMock.expectOne(`${base}/users?status=completed`).flush({ users: [] });
  });

  it('should fetch the module and learner detail endpoints', () => {
    service.getModuleDetail(1, 10, {}).subscribe();
    service.getLearnerDetail(1, 4).subscribe();

    httpMock.expectOne(`${base}/modules/10`).flush({});
    httpMock.expectOne(`${base}/users/4`).flush({});
  });

  it('should fetch the CSV export as a file', () => {
    service.exportCsv(1, {}).subscribe();

    const req = httpMock.expectOne(`${base}/export?format=csv`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['a,b']));
  });
});

describe('ReportsEffects', () => {
  let effects: ReportsEffects;
  let actions$: Observable<any>;
  let service: jasmine.SpyObj<ReportsService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('ReportsService', [
      'getOverview',
      'getModules',
      'getLearners',
      'getModuleDetail',
      'getLearnerDetail',
    ]);
    TestBed.configureTestingModule({
      providers: [
        ReportsEffects,
        provideMockActions(() => actions$),
        { provide: ReportsService, useValue: service },
      ],
    });
    effects = TestBed.inject(ReportsEffects);
  });

  it('should load the overview and module breakdown together', (done) => {
    service.getOverview.and.returnValue(of({ totalUsers: 3, modulesAssignedCount: 5, completionRate: 23.1, averageScore: 83.3 }));
    service.getModules.and.returnValue(
      of({ modules: [{ moduleId: 1, title: 'Email', completionRate: 33.3, averageScore: 100, passRate: 100 }] }),
    );
    actions$ = of(ReportsActions.fetchReport({ organisationId: 1, range: {} }));

    effects.fetchReport$.subscribe((action) => {
      expect(action).toEqual(
        ReportsActions.fetchReportSuccess({
          overview: { totalUsers: 3, modulesAssignedCount: 5, completionRate: 23.1, averageScore: 83.3 },
          modules: [{ moduleId: 1, title: 'Email', completionRate: 33.3, averageScore: 100, passRate: 100 }],
        }),
      );
      done();
    });
  });

  it("should surface the backend's reason on failure", (done) => {
    service.getOverview.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Invalid startDate: x' } }),
      ),
    );
    service.getModules.and.returnValue(of({ modules: [] }));
    actions$ = of(ReportsActions.fetchReport({ organisationId: 1, range: { startDate: 'x' } }));

    effects.fetchReport$.subscribe((action) => {
      expect(action).toEqual(ReportsActions.fetchReportFailure({ error: 'Invalid startDate: x' }));
      done();
    });
  });
});

describe('reportsReducer', () => {
  it('should clear a detail panel while the next one loads', () => {
    const withDetail = {
      ...initialReportsState,
      moduleDetail: {
        moduleId: 1,
        title: 'Email',
        scoreDistribution: [],
        statusBreakdown: { notStarted: 0, inProgress: 0, completed: 0 },
      },
    };

    const state = reportsReducer(
      withDetail,
      ReportsActions.fetchModuleDetail({ organisationId: 1, moduleId: 2, range: {} }),
    );

    expect(state.moduleDetail).toBeNull();
  });

  it('should track learner loading separately from the rest of the report', () => {
    const state = reportsReducer(
      initialReportsState,
      ReportsActions.fetchLearners({ organisationId: 1, range: {}, status: null }),
    );

    expect(state.learnersLoading).toBeTrue();
    expect(state.loading).toBeFalse();
  });
});
