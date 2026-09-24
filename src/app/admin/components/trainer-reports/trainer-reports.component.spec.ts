import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TrainerReportsComponent } from './trainer-reports.component';
import { DashboardActions } from '../../+state/dashboard.actions';
import { selectDashboardStats } from '../../+state/dashboard.selectors';
import { TrainerDashboardStats } from '../../+state/dashboard.model';
import { ReportsActions } from '../../+state/reports.actions';
import { ReportsService } from '../../+state/reports.service';
import {
  selectLearnerReportDetail,
  selectLearnerReportRows,
  selectLearnerReportsLoading,
  selectModuleReportDetail,
  selectModuleReportRows,
  selectReportOverview,
  selectReportsError,
  selectReportsLoading,
} from '../../+state/reports.selectors';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { UserAccount } from 'src/app/users/+state/user-account.model';
import { selectOrganisationScope } from 'src/app/organisations/+state/organisations.selectors';

describe('TrainerReportsComponent', () => {
  let component: TrainerReportsComponent;
  let fixture: ComponentFixture<TrainerReportsComponent>;
  let store: MockStore;
  let reportsService: jasmine.SpyObj<ReportsService>;

  const stats: TrainerDashboardStats = {
    totalLearners: 3,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [],
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
      id: '4',
      username: 'Mystery',
      firstName: 'Mia',
      lastName: 'Stery',
      fullName: 'Mia Stery',
      email: 'mia@example.com',
      role: 'user',
      weaknesses: ['PHISHING', 'VISHING'],
    },
    {
      id: '5',
      username: 'dashtest1',
      firstName: '',
      lastName: '',
      fullName: '',
      email: 'dash@example.com',
      role: 'user',
      weaknesses: ['PHISHING'],
    },
  ];

  const baseSelectors = () => [
    { selector: selectOrganisationScope, value: { isGlobalAdmin: false, organisationId: 1 } },
    {
      selector: selectReportOverview,
      value: { totalUsers: 3, modulesAssignedCount: 5, completionRate: 23.1, averageScore: 83.3 },
    },
    {
      selector: selectModuleReportRows,
      value: [
        { moduleId: 1, title: 'Email Phishing Fundamentals', completionRate: 33.3, averageScore: 100, passRate: 100 },
        { moduleId: 10, title: 'Example module', completionRate: 33.3, averageScore: 50, passRate: 0 },
      ],
    },
    {
      selector: selectLearnerReportRows,
      value: [
        { userId: 4, username: 'Mystery', completionRate: 60, averageScore: 83.3, atRisk: false },
        { userId: 5, username: 'dashtest1', completionRate: 20, averageScore: 40, atRisk: true },
      ],
    },
    { selector: selectModuleReportDetail, value: null },
    { selector: selectLearnerReportDetail, value: null },
    { selector: selectReportsLoading, value: false },
    { selector: selectLearnerReportsLoading, value: false },
    { selector: selectReportsError, value: null },
    { selector: selectUserList, value: learners },
    { selector: selectDashboardStats, value: stats },
  ];

  async function setUp() {
    reportsService = jasmine.createSpyObj('ReportsService', ['exportCsv']);

    await TestBed.configureTestingModule({
      imports: [TrainerReportsComponent, RouterTestingModule],
      providers: [
        provideMockStore({ selectors: baseSelectors() }),
        { provide: ReportsService, useValue: reportsService },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(TrainerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    store?.resetSelectors();
  });

  it("should load the organisation's report, learners and extras on init", async () => {
    await setUp();

    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchReport({ organisationId: 1, range: {} }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchLearners({ organisationId: 1, range: {}, status: null }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(UsersActions.fetchList({ organisationId: 1 }));
    expect(store.dispatch).toHaveBeenCalledWith(DashboardActions.fetchTrainerDashboard());
  });

  it('should show the overview figures from the reports endpoint', async () => {
    await setUp();
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(text).toContain('23.1%');
    expect(text).toContain('83.3%');
    expect(component.overview?.modulesAssignedCount).toBe(5);
  });

  it('should reload everything for the chosen date range', async () => {
    await setUp();
    (store.dispatch as jasmine.Spy).calls.reset();
    const start = new Date('2026-09-20T00:00:00.000Z');
    const end = new Date('2026-09-30T23:59:59.999Z');

    component.onDateRangeChange({ start, end });

    const range = { startDate: start.toISOString(), endDate: end.toISOString() };
    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchReport({ organisationId: 1, range }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchLearners({ organisationId: 1, range, status: null }),
    );
  });

  it('should only reload learners when the status filter changes', async () => {
    await setUp();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.onLearnerStatusChange('completed');

    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchLearners({ organisationId: 1, range: {}, status: 'completed' }),
    );
    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ReportsActions.fetchReport.type }),
    );
  });

  it("should show learners by full name, falling back to username, and flag who's at risk", async () => {
    await setUp();

    expect(component.learnerRows.map((row) => row['name'])).toEqual(['Mia Stery', 'dashtest1']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('At risk');
  });

  it('should open a module breakdown', async () => {
    await setUp();

    component.moduleActions[0].action(component.moduleRows[0]);

    expect(component.selectedModuleId).toBe(1);
    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchModuleDetail({ organisationId: 1, moduleId: 1, range: {} }),
    );
  });

  it('should render the module breakdown once loaded', async () => {
    await setUp();
    component.viewModule(1);
    store.overrideSelector(selectModuleReportDetail, {
      moduleId: 1,
      title: 'Email Phishing Fundamentals',
      scoreDistribution: [
        { range: '0-50', count: 0 },
        { range: '51-80', count: 0 },
        { range: '81-100', count: 1 },
      ],
      statusBreakdown: { notStarted: 2, inProgress: 0, completed: 1 },
    });
    store.refreshState();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(component.moduleLearnerTotal).toBe(3);
    expect(text).toContain('Not started · 2');
    expect(text).toContain('81-100% · 1 learner');
  });

  it("should open a learner's module list", async () => {
    await setUp();

    component.learnerActions[0].action(component.learnerRows[1]);

    expect(component.selectedLearnerId).toBe(5);
    expect(store.dispatch).toHaveBeenCalledWith(
      ReportsActions.fetchLearnerDetail({ organisationId: 1, userId: 5 }),
    );
  });

  it('should aggregate weakness categories across learners', async () => {
    await setUp();

    expect(component.categoryBreakdown[0]).toEqual(
      jasmine.objectContaining({ category: 'PHISHING', learnerCount: 2, percentage: 100 }),
    );
  });

  it('should keep the recent activity feed', async () => {
    await setUp();

    expect(component.recentActivity.length).toBe(1);
  });

  it('should prompt a global admin to pick one organisation, fetching nothing', async () => {
    reportsService = jasmine.createSpyObj('ReportsService', ['exportCsv']);
    await TestBed.configureTestingModule({
      imports: [TrainerReportsComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: baseSelectors().map((entry) =>
            entry.selector === selectOrganisationScope
              ? { ...entry, value: { isGlobalAdmin: true, organisationId: null } }
              : entry,
          ),
        }),
        { provide: ReportsService, useValue: reportsService },
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(TrainerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.needsOrganisation).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Select an organisation above',
    );
  });

  it('should download the CSV export for the current date range', async () => {
    await setUp();
    reportsService.exportCsv.and.returnValue(of(new Blob(['a,b'], { type: 'text/csv' })));
    const click = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.callFake(
      () => ({ click, href: '', download: '' }) as unknown as HTMLAnchorElement,
    );

    component.exportCsv();

    expect(reportsService.exportCsv).toHaveBeenCalledWith(1, {});
    expect(click).toHaveBeenCalled();
  });

  it('should export the PDF via the browser print pipeline', async () => {
    await setUp();
    spyOn(window, 'print');

    component.exportReport();

    expect(window.print).toHaveBeenCalled();
  });
});
