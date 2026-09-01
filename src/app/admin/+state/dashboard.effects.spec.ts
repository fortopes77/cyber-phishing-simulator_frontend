import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { DashboardEffects } from './dashboard.effects';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from './dashboard.service';
import { TrainerDashboardStats } from './dashboard.model';

describe('DashboardEffects', () => {
  let effects: DashboardEffects;
  let actions$: Observable<any>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  const stats: TrainerDashboardStats = {
    totalLearners: 52,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [],
    recentActivity: [],
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DashboardService', [
      'getTrainerDashboard',
    ]);

    TestBed.configureTestingModule({
      providers: [
        DashboardEffects,
        provideMockActions(() => actions$),
        { provide: DashboardService, useValue: spy },
      ],
    });

    effects = TestBed.inject(DashboardEffects);
    dashboardService = TestBed.inject(
      DashboardService,
    ) as jasmine.SpyObj<DashboardService>;
  });

  it('should dispatch fetchTrainerDashboardSuccess with a flat response', (done) => {
    dashboardService.getTrainerDashboard.and.returnValue(of(stats));
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardSuccess({ stats }),
      );
      done();
    });
  });

  it('should dispatch fetchTrainerDashboardSuccess with a wrapped response', (done) => {
    dashboardService.getTrainerDashboard.and.returnValue(of({ stats }));
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardSuccess({ stats }),
      );
      done();
    });
  });

  it('should dispatch fetchTrainerDashboardFailure on error', (done) => {
    dashboardService.getTrainerDashboard.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(DashboardActions.fetchTrainerDashboard());

    effects.fetchTrainerDashboard$.subscribe((action) => {
      expect(action).toEqual(
        DashboardActions.fetchTrainerDashboardFailure({
          error: 'Network error',
        }),
      );
      done();
    });
  });
});
