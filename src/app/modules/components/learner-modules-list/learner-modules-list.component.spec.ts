import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LearnerModulesListComponent } from './learner-modules-list.component';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectMyResults } from 'src/app/results/+state/results.selectors';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

describe('LearnerModulesListComponent', () => {
  let component: LearnerModulesListComponent;
  let fixture: ComponentFixture<LearnerModulesListComponent>;
  let store: MockStore;

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
      imports: [LearnerModulesListComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
            { selector: selectMyResults, value: results },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(LearnerModulesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch only the modules assigned to the signed-in learner', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.fetchList({ assignedToMe: true }),
    );
  });

  it('should map modules with scenario counts and progress from the store', () => {
    expect(component.modules.length).toBe(1);
    expect(component.modules[0].scenarios).toBe(2);
    expect(component.modules[0].progress).toBe(0.5);
    expect(component.modules[0].difficulty).toBe('beginner');
  });

  it('should filter modules by search text', () => {
    component.search = 'nonexistent';
    component.applyFilters();
    expect(component.filteredModules.length).toBe(0);
  });

  it('should default an in-progress module to not passed (unused until complete)', () => {
    expect(component.modules[0].passed).toBeFalse();
  });

  it('should show a cross for a completed module that was not passed', () => {
    expect(component.getStatusClass(1, false)).toBe('failed');
    expect(component.getStatusIcon(1, false)).toBe(iconLibrary.closeIcon);
  });

  it('should show a green check for a completed module that was passed', () => {
    expect(component.getStatusClass(1, true)).toBe('completed');
    expect(component.getStatusIcon(1, true)).toBe(iconLibrary.checkCircleIcon);
  });

  it('should ignore the passed flag while a module is still in progress or not started', () => {
    expect(component.getStatusClass(0.5, false)).toBe('in-progress');
    expect(component.getStatusIcon(0.5, false)).toBe(iconLibrary.clockIcon);
    expect(component.getStatusClass(0, false)).toBe('not-started');
    expect(component.getStatusIcon(0, false)).toBe(iconLibrary.circleRegularIcon);
  });

  it("should read a completed module's pass/fail from its moduleResult", () => {
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

    const passedModule = component.modules.find((m) => m.id === 1);
    const failedModule = component.modules.find((m) => m.id === 2);
    expect(passedModule?.passed).toBeTrue();
    expect(failedModule?.passed).toBeFalse();
  });

  it('should render "Passed"/"Not Passed" instead of "Completed" on finished module cards', () => {
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
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Passed Module');
    expect(text).toContain('Failed Module');
    expect(text).toContain('Not Passed');
    expect(text).not.toContain('Completed');

    const fills = fixture.nativeElement.querySelectorAll('.progress-fill');
    expect(fills[0].classList).not.toContain('failed');
    expect(fills[1].classList).toContain('failed');
  });
});
