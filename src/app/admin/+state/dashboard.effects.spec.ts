import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';
import { DashboardEffects } from './dashboard.effects';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from './dashboard.service';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';

describe('DashboardEffects', () => {
  let effects: DashboardEffects;
  let actions$: Observable<any>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let store: MockStore;

  const authState = {
    loading: false,
    isAuthenticated: true,
    user: { id: '1', username: 't', email: 't@t.com', role: 'trainer' as const, organisationId: 1 },
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DashboardService', ['getOverview', 'getActivity']);

    TestBed.configureTestingModule({
      providers: [
        DashboardEffects,
        provideMockActions(() => actions$),
        { provide: DashboardService, useValue: spy },
        provideMockStore({ selectors: [{ selector: selectAuthState, value: authState }] }),
      ],
    });

    effects = TestBed.inject(DashboardEffects);
    dashboardService = TestBed.inject(
      DashboardService,
    ) as jasmine.SpyObj<DashboardService>;
    store = TestBed.inject(MockStore);
  });

  it("should fetch both endpoints with the trainer's organisationId and dispatch fetchTrainerDashboardSuccess", (done) => {
    dashboardService.getOverview.and.returnValue(
      of({ totalLearners: 52, activeModules: 8, completionRate: 78, averageScore: 81 }),
    );
    dashboardService.getActivity.and.returnValue(
      of([
        {
          userName: 'Joseph Smith',
          action: 'Completed Email Phishing Basics',
          status: 'completed',
          timestamp: '2 hours ago',
        },
      ]),
    );
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(dashboardService.getOverview).toHaveBeenCalledWith(1);
      expect(dashboardService.getActivity).toHaveBeenCalledWith(1);
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardSuccess({
          stats: {
            totalLearners: 52,
            activeModules: 8,
            completionRate: 78,
            averageScore: 81,
            moduleCompletion: [],
            recentActivity: [
              {
                id: undefined,
                userName: 'Joseph Smith',
                action: 'Completed Email Phishing Basics',
                status: 'completed',
                timestamp: '2 hours ago',
                moduleName: undefined,
              },
            ],
          },
        }),
      );
      done();
    });
  });

  it('should dispatch fetchTrainerDashboardFailure when either call errors', (done) => {
    dashboardService.getOverview.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    dashboardService.getActivity.and.returnValue(of([]));
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch fetchTrainerDashboardFailure without calling the backend when the account has no organisation', (done) => {
    store.overrideSelector(selectAuthState, {
      loading: false,
      isAuthenticated: true,
      user: { id: '1', username: 't', email: 't@t.com', role: 'trainer' as const },
    });
    store.refreshState();
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(dashboardService.getOverview).not.toHaveBeenCalled();
      expect(dashboardService.getActivity).not.toHaveBeenCalled();
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardFailure({
          error: 'No organisation on the signed-in account',
        }),
      );
      done();
    });
  });
});
