import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LearnerModulesListComponent } from './learner-modules-list.component';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';

describe('LearnerModulesListComponent', () => {
  let component: LearnerModulesListComponent;
  let fixture: ComponentFixture<LearnerModulesListComponent>;
  let store: MockStore;

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
      imports: [LearnerModulesListComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
            { selector: selectAttempts, value: attempts },
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
