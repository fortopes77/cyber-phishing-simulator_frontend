import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TrainerReportsComponent } from './trainer-reports.component';
import { DashboardActions } from '../../+state/dashboard.actions';
import {
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardStats,
} from '../../+state/dashboard.selectors';
import { TrainerDashboardStats } from '../../+state/dashboard.model';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UserAccount } from 'src/app/users/+state/user-account.model';

describe('TrainerReportsComponent', () => {
  let component: TrainerReportsComponent;
  let fixture: ComponentFixture<TrainerReportsComponent>;
  let store: MockStore;

  const stats: TrainerDashboardStats = {
    totalLearners: 3,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [
      { moduleId: 4, moduleName: 'Email Phishing Basics', completionPercentage: 62 },
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

  const learners: UserAccount[] = [
    {
      id: '1',
      username: 'ava.smith',
      firstName: 'Ava',
      lastName: 'Smith',
      fullName: 'Ava Smith',
      email: 'ava@example.com',
      role: 'user',
      progressPercentage: 90,
      averageScore: 95,
      lastActiveAt: '2026-08-22T12:00:00.000Z',
      weaknesses: ['PHISHING', 'VISHING'],
    },
    {
      id: '2',
      username: 'ben.jones',
      firstName: 'Ben',
      lastName: 'Jones',
      fullName: 'Ben, Jones',
      email: 'ben@example.com',
      role: 'user',
      progressPercentage: 40,
      averageScore: 45,
      lastActiveAt: null,
      weaknesses: ['PHISHING'],
    },
    {
      id: '3',
      username: 'cara.lee',
      firstName: 'Cara',
      lastName: 'Lee',
      fullName: 'Cara Lee',
      email: 'cara@example.com',
      role: 'user',
      progressPercentage: 60,
      averageScore: null,
      lastActiveAt: '2026-08-20T12:00:00.000Z',
      weaknesses: [],
    },
  ];

  const authState = {
    isAuthenticated: true,
    loading: false,
    user: { id: '99', username: 't', email: 't@t.com', role: 'trainer' as const, organisationId: 1 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainerReportsComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectDashboardStats, value: stats },
            { selector: selectDashboardLoading, value: false },
            { selector: selectDashboardError, value: null },
            { selector: selectUserList, value: learners },
            { selector: selectAuthState, value: authState },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(TrainerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch fetchTrainerDashboard and fetchList with the organisation id on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(DashboardActions.fetchTrainerDashboard());
    expect(store.dispatch).toHaveBeenCalledWith(UsersActions.fetchList({ organisationId: 1 }));
  });

  it('should map the dashboard stats onto the stat cards and module list', () => {
    expect(component.totalLearners).toBe(3);
    expect(component.activeModules).toBe(8);
    expect(component.completionRate).toBe(78);
    expect(component.averageScore).toBe(81);
    expect(component.moduleCompletion.length).toBe(1);
    expect(component.recentActivity.length).toBe(1);
  });

  it('should aggregate weakness categories across learners, sorted by how many learners are affected', () => {
    expect(component.categoryBreakdown).toEqual([
      { category: 'PHISHING', label: 'Phishing', learnerCount: 2, percentage: 67 },
      { category: 'VISHING', label: 'Vishing (Voice)', learnerCount: 1, percentage: 33 },
    ]);
  });

  it('should rank learners with a score highest-first for top performers, excluding unscored learners', () => {
    expect(component.topPerformers.map((learner) => learner.id)).toEqual(['1', '2']);
  });

  it('should list only learners scoring below 60%, lowest-first, for needs attention', () => {
    expect(component.needsAttention.map((learner) => learner.id)).toEqual(['2']);
  });

  it('should surface a load error without keeping stale defaults hidden', () => {
    store.overrideSelector(selectDashboardError, 'Failed to fetch dashboard stats');
    store.refreshState();

    expect(component.dashboardError).toBe('Failed to fetch dashboard stats');
  });

  describe('exportReport', () => {
    it('should export via the browser\'s print pipeline ("Save as PDF"), not a generated file', () => {
      spyOn(window, 'print');

      component.exportReport();

      expect(window.print).toHaveBeenCalled();
    });
  });
});
