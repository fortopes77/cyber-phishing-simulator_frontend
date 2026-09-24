import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ModulePageComponent } from './module-page.component';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';

describe('ModulePageComponent', () => {
  let component: ModulePageComponent;
  let fixture: ComponentFixture<ModulePageComponent>;
  let router: Router;
  let store: MockStore;

  afterEach(() => {
    store?.resetSelectors();
  });

  const modules = [
    { moduleId: 1, moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];
  const scenarios = [
    { id: 1, moduleId: 1, title: 'Urgent Password Reset', difficulty: 'easy' },
    { id: 2, moduleId: 1, title: 'IT Department Software Update', difficulty: 'medium' },
  ];
  // Scenario 1 answered in an unfinished attempt at module 1 - progress
  // comes from the answers tied to that attempt (see buildModuleProgress).
  const results = {
    moduleResults: [
      {
        id: 1,
        moduleId: 1,
        moduleName: 'Module',
        status: 'IN_PROGRESS',
        totalScore: 0,
        maxScore: 0,
        percentageScore: 0,
        passed: false,
        completedAt: null,
      },
    ],
    scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 1 }],
    averageScore: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePageComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '1' })),
          },
        },
        provideMockStore({
          selectors: [
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
            { selector: selectMyResults, value: results },
          ],
        }),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(router, 'navigate');
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(ModulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the module id from the route params as a number', () => {
    expect(component.moduleId).toBe(1);
  });

  it('should derive the module title from the modules feature store', () => {
    expect(component.title).toBe('Phishing Awareness');
  });

  it('should dispatch actions to load the module, its scenarios, and results', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({ moduleId: 1 }),
    );
  });

  it('should compute progress from GET /results/me scoped to the module', () => {
    expect(component.scenarios.length).toBe(2);
    expect(component.completedCount).toBe(1);
    expect(component.progressPercentage).toBe(50);
    expect(component.isModuleComplete).toBeFalse();
  });

  it('should navigate to the next incomplete scenario on continue', () => {
    component.continueModule();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });

  describe('module action button', () => {
    const buttonText = () =>
      (fixture.nativeElement as HTMLElement)
        .querySelector('.module-header__right .primary-button')
        ?.textContent?.trim();

    const withAttempts = (moduleResults: any[], scenarioResults: any[]) => {
      store.overrideSelector(selectMyResults, {
        moduleResults,
        scenarioResults,
        averageScore: null,
      });
      store.refreshState();
      fixture.detectChanges();
    };

    const completedAttempt = {
      id: 5,
      moduleId: 1,
      moduleName: 'Module',
      status: 'COMPLETED',
      totalScore: 2,
      maxScore: 2,
      percentageScore: 100,
      passed: true,
      completedAt: '2026-09-01T00:00:00.000Z',
    };

    it('should say Continue Module while an attempt is in progress', () => {
      fixture.detectChanges();

      expect(component.moduleStatus).toBe('In progress');
      expect(buttonText()).toBe('Continue Module');
    });

    it('should say Start Module before any attempt', () => {
      withAttempts([], []);

      expect(component.moduleStatus).toBe('Assigned');
      expect(buttonText()).toBe('Start Module');
    });

    it('should start from the first scenario', () => {
      withAttempts([], []);
      component.continueModule();

      expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 1]);
    });

    it('should say Restart Module once completed, and restart from the first scenario', () => {
      withAttempts(
        [completedAttempt],
        [
          { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 5 },
          { scenarioId: '2', moduleId: 1, correct: true, moduleResultId: 5 },
        ],
      );

      expect(component.isModuleComplete).toBeTrue();
      expect(buttonText()).toBe('Restart Module');

      component.continueModule();
      expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 1]);
    });

    it('should restart from the first scenario even if one was added after completing', () => {
      withAttempts(
        [completedAttempt],
        [{ scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 5 }],
      );

      expect(buttonText()).toBe('Restart Module');
      component.continueModule();
      expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 1]);
    });
  });
});
