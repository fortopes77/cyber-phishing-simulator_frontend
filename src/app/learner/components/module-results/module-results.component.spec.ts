import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ModuleResultsComponent } from './module-results.component';
import { ModuleResultsActions } from 'src/app/module-results/+state/module-results.actions';
import {
  selectModuleResult,
  selectModuleResultError,
  selectModuleResultLoading,
} from 'src/app/module-results/+state/module-results.selectors';
import { ModuleResult } from 'src/app/module-results/+state/module-result.model';

describe('ModuleResultsComponent', () => {
  let component: ModuleResultsComponent;
  let fixture: ComponentFixture<ModuleResultsComponent>;
  let router: Router;
  let store: MockStore;

  const result: ModuleResult = {
    moduleId: 1,
    moduleName: 'Email Phishing Basics',
    totalScore: 2,
    maxScore: 2,
    percentageScore: 100,
    passingScore: 70,
    passed: true,
    scenarioResults: [
      { scenarioId: 's_1', title: 'Urgent Password Reset', decision: 'Suspicious', correct: true },
      { scenarioId: 's_2', title: 'IT Department Software Update', decision: 'Safe', correct: true },
    ],
  };

  async function setup(queryParamMap: Record<string, string> = { moduleId: '1' }) {
    await TestBed.configureTestingModule({
      imports: [ModuleResultsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModuleResult, value: result },
            { selector: selectModuleResultLoading, value: false },
            { selector: selectModuleResultError, value: null },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParamMap) },
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ModuleResultsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should dispatch fetchModuleResult for the moduleId from the query params', async () => {
    await setup({ moduleId: '42' });
    expect(store.dispatch).toHaveBeenCalledWith(
      ModuleResultsActions.fetchModuleResult({ moduleId: 42 }),
    );
  });

  it('should not dispatch when no moduleId query param is present', async () => {
    await setup({});
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should display the total score, percentage score, pass/fail status and scenario breakdown', async () => {
    await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Email Phishing Basics');
    expect(text).toContain('100%');
    expect(text).toContain('2 / 2 points');
    expect(text).toContain('Passed');
    expect(text).toContain('Urgent Password Reset');
    expect(text).toContain('IT Department Software Update');
  });

  it('should show a "Not Passed" badge when the result failed', async () => {
    await setup();
    component.result = { ...result, passed: false };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Not Passed');
  });

  it('should show a loading message while the result is loading', async () => {
    await setup();
    component.loading = true;
    component.result = null;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading your results',
    );
  });

  it('should show an error message when the fetch fails', async () => {
    await setup();
    component.error = 'Not found';
    component.result = null;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Not found');
  });

  it('should navigate to the module page for the current moduleId on retry', async () => {
    await setup({ moduleId: '7' });
    spyOn(router, 'navigate');

    component.retryModule();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules', 7]);
  });

  it('should navigate to the assigned modules list', async () => {
    await setup();
    spyOn(router, 'navigate');

    component.backToAssignedModules();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules']);
  });

  it('should navigate to the learner dashboard', async () => {
    await setup();
    spyOn(router, 'navigate');

    component.backToDashboard();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/dashboard']);
  });
});
