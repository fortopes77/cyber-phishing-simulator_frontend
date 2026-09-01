import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { DashboardActions } from '../../+state/dashboard.actions';
import {
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardStats,
} from '../../+state/dashboard.selectors';
import { TrainerDashboardStats } from '../../+state/dashboard.model';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let store: MockStore;
  let router: Router;

  const stats: TrainerDashboardStats = {
    totalLearners: 52,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [
      { moduleName: 'Email Phishing Basics', completionPercentage: 50 },
      { moduleName: 'SMS Phishing Basics', completionPercentage: 28 },
    ],
    recentActivity: [
      {
        userName: 'Joseph Smith',
        action: 'Completed Email Phishing Basics',
        timestamp: '2 hours ago',
        status: 'completed',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectDashboardStats, value: stats },
            { selector: selectDashboardLoading, value: false },
            { selector: selectDashboardError, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch fetchTrainerDashboard on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      DashboardActions.fetchTrainerDashboard(),
    );
  });

  it('should map the dashboard stats onto the stat cards and module/activity lists', () => {
    expect(component.totalLearners).toBe(52);
    expect(component.activeModules).toBe(8);
    expect(component.completionRate).toBe(78);
    expect(component.averageScore).toBe(81);
    expect(component.moduleCompletion.length).toBe(2);
    expect(component.activities.length).toBe(1);
  });

  it('should navigate to the learners list', () => {
    component.manageLearners();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/learners']);
  });

  it('should navigate to the modules list', () => {
    component.viewActiveModules();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });

  it('should navigate to the modules list for the completion overview action', () => {
    component.viewModuleDetails();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });

  it('should navigate to the analytics destination for view reports', () => {
    component.viewReports();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/analytics']);
  });

  it('should surface a load error without keeping stale defaults hidden', () => {
    store.overrideSelector(selectDashboardError, 'Failed to fetch dashboard stats');
    store.refreshState();

    expect(component.dashboardError).toBe('Failed to fetch dashboard stats');
  });
});
