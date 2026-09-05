import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { LearningProgressCardComponent } from '../learning-progress-card/learning-progress-card.component';
import { AssignedModuleCardComponent } from '../assigned-module-card/assigned-module-card.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;
  let store: MockStore;
  let router: Router;

  const currentUser = {
    id: 'u_1',
    username: 'test-user',
    email: 'test@example.com',
    role: 'user' as const,
  };
  const modules = [
    { moduleId: 1, moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];
  const scenarios = [
    { id: 1, moduleId: 1, difficulty: 'easy' },
    { id: 2, moduleId: 1, difficulty: 'easy' },
  ];
  const results = {
    scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
    averageScore: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserDashboardComponent],
      imports: [
        CommonModule,
        RouterTestingModule,
        DataCardComponent,
        DashboardCardComponent,
        LearningProgressCardComponent,
        AssignedModuleCardComponent,
        HeaderComponent,
      ],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectAuthState,
              value: { isAuthenticated: true, user: currentUser, loading: false },
            },
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
            { selector: selectMyResults, value: results },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch fetchList scoped to the signed-in learner', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.fetchList({ assignedToMe: true }),
    );
  });

  it('should dispatch fetchMyResults on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(ResultsActions.fetchMyResults());
  });

  it('should compute assigned modules with progress from the store', () => {
    expect(component.assignedModules.length).toBe(1);
    expect(component.assignedModules[0].progressPercentage).toBe(50);
    expect(component.assignedModules[0].status).toBe('In progress');
  });

  it('should label a fully-completed module Passed or Not Passed based on its moduleResult', () => {
    store.overrideSelector(selectModuleList, [
      { moduleId: 1, moduleName: 'Passed Module', description: '' },
      { moduleId: 2, moduleName: 'Failed Module', description: '' },
    ]);
    store.overrideSelector(selectScenarioList, [
      { id: 1, moduleId: 1, difficulty: 'easy' },
      { id: 2, moduleId: 2, difficulty: 'easy' },
    ]);
    store.overrideSelector(selectMyResults, {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Passed Module',
          status: 'COMPLETED',
          totalScore: 1,
          maxScore: 1,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 2,
          moduleName: 'Failed Module',
          status: 'COMPLETED',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true },
        { scenarioId: '2', moduleId: 2, correct: false },
      ],
      averageScore: null,
    });
    store.refreshState();

    const passedModule = component.assignedModules.find((m) => m.id === 1);
    const failedModule = component.assignedModules.find((m) => m.id === 2);
    expect(passedModule?.status).toBe('Passed');
    expect(failedModule?.status).toBe('Not Passed');
  });

  it('should default a completed module to Not Passed when there is no moduleResult yet', () => {
    store.overrideSelector(selectModuleList, [
      { moduleId: 1, moduleName: 'Completed Module', description: '' },
    ]);
    store.overrideSelector(selectScenarioList, [
      { id: 1, moduleId: 1, difficulty: 'easy' },
    ]);
    store.overrideSelector(selectMyResults, {
      moduleResults: [],
      scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
      averageScore: null,
    });
    store.refreshState();

    expect(component.assignedModules[0].status).toBe('Not Passed');
  });

  it('should sort assigned modules: in progress, then not-started, then completed but failed, then completed and passed', () => {
    store.overrideSelector(selectModuleList, [
      { moduleId: 1, moduleName: 'Passed Module', description: '' },
      { moduleId: 2, moduleName: 'Not Started Module', description: '' },
      { moduleId: 3, moduleName: 'In Progress Module', description: '' },
      { moduleId: 4, moduleName: 'Failed Module', description: '' },
    ]);
    store.overrideSelector(selectScenarioList, [
      { id: 1, moduleId: 1, difficulty: 'easy' },
      { id: 2, moduleId: 2, difficulty: 'easy' },
      { id: 3, moduleId: 3, difficulty: 'easy' },
      { id: 4, moduleId: 3, difficulty: 'easy' },
      { id: 5, moduleId: 4, difficulty: 'easy' },
    ]);
    store.overrideSelector(selectMyResults, {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Passed Module',
          status: 'COMPLETED',
          totalScore: 1,
          maxScore: 1,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 4,
          moduleName: 'Failed Module',
          status: 'COMPLETED',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      // Module 1: fully completed and passed. Module 2: nothing done (not
      // started). Module 3: one of two scenarios done (in progress).
      // Module 4: fully completed but failed.
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true },
        { scenarioId: '3', moduleId: 3, correct: true },
        { scenarioId: '5', moduleId: 4, correct: false },
      ],
      averageScore: null,
    });
    store.refreshState();

    expect(component.assignedModules.map((m) => m.title)).toEqual([
      'In Progress Module',
      'Not Started Module',
      'Failed Module',
      'Passed Module',
    ]);
  });

  it('should surface the in-progress module as continueLearning', () => {
    expect(component.continueLearning?.id).toBe(1);
    expect(component.continueLearning?.progressPercentage).toBe(50);
  });

  it('should compute dashboard stats from GET /results/me', () => {
    expect(component.stats.scenariosCompleted).toBe(1);
    expect(component.stats.totalScenarios).toBe(2);
    expect(component.stats.averageScore).toBe(100);
  });

  it("should use the backend's own averageScore when GET /results/me provides one", () => {
    store.overrideSelector(selectMyResults, {
      scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
      averageScore: 88,
    });
    store.refreshState();

    expect(component.stats.averageScore).toBe(88);
  });

  it('should derive averageScore from the individual scenario results when the backend sends none', () => {
    store.overrideSelector(selectMyResults, {
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true },
        { scenarioId: '2', moduleId: 1, correct: false },
      ],
      averageScore: null,
    });
    store.refreshState();

    expect(component.stats.scenariosCompleted).toBe(2);
    expect(component.stats.averageScore).toBe(50);
  });

  it('should navigate to the modules list when View All is clicked', () => {
    component.viewAllModules();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules']);
  });

  it('should hide Continue Learning when nothing is partway in progress', () => {
    store.overrideSelector(selectMyResults, {
      scenarioResults: [],
      averageScore: null,
    });
    store.refreshState();

    expect(component.continueLearning).toBeNull();
  });

  it('should hide Continue Learning when every module is already complete', () => {
    store.overrideSelector(selectMyResults, {
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true },
        { scenarioId: '2', moduleId: 1, correct: true },
      ],
      averageScore: null,
    });
    store.refreshState();

    expect(component.continueLearning).toBeNull();
  });

  it('should default every stat to 0 when there is no data to work with', () => {
    store.overrideSelector(selectModuleList, []);
    store.overrideSelector(selectScenarioList, []);
    store.overrideSelector(selectMyResults, { scenarioResults: [], averageScore: null });
    store.refreshState();

    expect(component.stats).toEqual({
      modulesCompleted: 0,
      totalModules: 0,
      scenariosCompleted: 0,
      totalScenarios: 0,
      averageScore: 0,
    });
    expect(component.assignedModules).toEqual([]);
    expect(component.continueLearning).toBeNull();
  });

  it('should show the "no modules assigned" message when the learner has no assigned modules', () => {
    store.overrideSelector(selectModuleList, []);
    store.refreshState();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No modules assigned, please contact your trainer.',
    );
  });
});
