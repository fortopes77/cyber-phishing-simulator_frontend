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

  const modules = [
    { moduleId: 1, moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];
  const scenarios = [
    { id: 1, moduleId: 1, title: 'Urgent Password Reset', difficulty: 'easy' },
    { id: 2, moduleId: 1, title: 'IT Department Software Update', difficulty: 'medium' },
  ];
  const results = {
    scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
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
});
