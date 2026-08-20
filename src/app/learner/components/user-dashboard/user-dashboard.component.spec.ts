import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
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

  const modules = [
    { moduleId: 'module1', moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];
  const scenarios = [
    { id: 's_001', moduleId: 'module1', difficulty: 'easy' },
    { id: 's_002', moduleId: 'module1', difficulty: 'easy' },
  ];
  const attempts = [{ id: 'a1', scenarioId: 's_001', decision: 'Report', correct: true }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserDashboardComponent],
      imports: [
        CommonModule,
        DataCardComponent,
        DashboardCardComponent,
        LearningProgressCardComponent,
        AssignedModuleCardComponent,
        HeaderComponent,
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAuthState, value: { isAuthenticated: false } },
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
            { selector: selectAttempts, value: attempts },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute assigned modules with progress from the store', () => {
    expect(component.assignedModules.length).toBe(1);
    expect(component.assignedModules[0].progressPercentage).toBe(50);
    expect(component.assignedModules[0].status).toBe('In progress');
  });

  it('should surface the in-progress module as continueLearning', () => {
    expect(component.continueLearning?.id).toBe('module1');
    expect(component.continueLearning?.progressPercentage).toBe(50);
  });

  it('should compute dashboard stats from scenarios and attempts', () => {
    expect(component.stats.scenariosCompleted).toBe(1);
    expect(component.stats.totalScenarios).toBe(2);
    expect(component.stats.averageScore).toBe(100);
  });
});
