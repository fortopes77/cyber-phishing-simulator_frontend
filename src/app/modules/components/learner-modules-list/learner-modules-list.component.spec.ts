import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LearnerModulesListComponent } from './learner-modules-list.component';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectMyResults } from 'src/app/results/+state/results.selectors';

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
});
