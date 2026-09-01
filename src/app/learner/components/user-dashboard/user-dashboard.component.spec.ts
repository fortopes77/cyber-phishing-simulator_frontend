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
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';
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
    { id: 's_001', moduleId: 1, difficulty: 'easy' },
    { id: 's_002', moduleId: 1, difficulty: 'easy' },
  ];
  const attempts = [{ id: 'a1', scenarioId: 's_001', decision: 'Report', correct: true }];

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
            { selector: selectAttempts, value: attempts },
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

  it('should dispatch fetchList scoped to the logged-in user once known', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.fetchList({ userId: 'u_1' }),
    );
  });

  it('should compute assigned modules with progress from the store', () => {
    expect(component.assignedModules.length).toBe(1);
    expect(component.assignedModules[0].progressPercentage).toBe(50);
    expect(component.assignedModules[0].status).toBe('In progress');
  });

  it('should surface the in-progress module as continueLearning', () => {
    expect(component.continueLearning?.id).toBe(1);
    expect(component.continueLearning?.progressPercentage).toBe(50);
  });

  it('should compute dashboard stats from scenarios and attempts', () => {
    expect(component.stats.scenariosCompleted).toBe(1);
    expect(component.stats.totalScenarios).toBe(2);
    expect(component.stats.averageScore).toBe(100);
  });

  it('should navigate to the modules list when View All is clicked', () => {
    component.viewAllModules();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules']);
  });

  it('should hide Continue Learning when nothing is partway in progress', () => {
    // No attempts at all -> every module sits at 0% (not started), which
    // should no longer surface as "continue learning".
    store.overrideSelector(selectAttempts, []);
    store.refreshState();

    expect(component.continueLearning).toBeNull();
  });

  it('should hide Continue Learning when every module is already complete', () => {
    store.overrideSelector(selectAttempts, [
      { id: 'a1', scenarioId: 's_001', decision: 'Report', correct: true },
      { id: 'a2', scenarioId: 's_002', decision: 'Report', correct: true },
    ]);
    store.refreshState();

    expect(component.continueLearning).toBeNull();
  });

  it('should default every stat to 0 when there is no data to work with', () => {
    store.overrideSelector(selectModuleList, []);
    store.overrideSelector(selectScenarioList, []);
    store.overrideSelector(selectAttempts, []);
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
