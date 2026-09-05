import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ModuleResultsComponent } from './module-results.component';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import {
  selectMyResults,
  selectResultsError,
  selectResultsLoading,
} from 'src/app/results/+state/results.selectors';
import { LearnerResults } from 'src/app/results/+state/results.model';

describe('ModuleResultsComponent', () => {
  let component: ModuleResultsComponent;
  let fixture: ComponentFixture<ModuleResultsComponent>;
  let router: Router;
  let store: MockStore;

  const results: LearnerResults = {
    moduleResults: [
      {
        id: 1,
        moduleId: 1,
        moduleName: 'Email Phishing Basics',
        status: 'COMPLETED',
        totalScore: 2,
        maxScore: 2,
        percentageScore: 100,
        passed: true,
        completedAt: '2026-09-02T00:00:00.000Z',
      },
      {
        id: 2,
        moduleId: 3,
        moduleName: 'Instant Messaging Attacks',
        status: 'COMPLETED',
        totalScore: 0,
        maxScore: 2,
        percentageScore: 0,
        passed: false,
        completedAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    scenarioResults: [
      {
        scenarioId: 's_1',
        moduleId: 1,
        correct: true,
        title: 'Urgent Password Reset',
        decision: 'Suspicious',
        moduleResultId: 1,
      },
      {
        scenarioId: 's_2',
        moduleId: 1,
        correct: true,
        title: 'IT Department Software Update',
        decision: 'Safe',
        moduleResultId: 1,
      },
    ],
    averageScore: null,
  };

  async function setup(paramMap: Record<string, string> = { moduleId: '1' }) {
    await TestBed.configureTestingModule({
      imports: [ModuleResultsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectMyResults, value: results },
            { selector: selectResultsLoading, value: false },
            { selector: selectResultsError, value: null },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(paramMap)),
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

  it('should dispatch fetchMyResults on init', async () => {
    await setup({ moduleId: '42' });
    expect(store.dispatch).toHaveBeenCalledWith(ResultsActions.fetchMyResults());
  });

  it('should leave result null when no moduleId route param is present', async () => {
    await setup({});
    expect(component.result).toBeNull();
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
    component.result = { ...component.result!, passed: false };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Not Passed');
  });

  it('should show a "no results yet" message when the moduleId has no matching result', async () => {
    await setup({ moduleId: '999' });

    expect(component.result).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No results yet for this module',
    );
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

  describe('overview (nav "Results" link, no moduleId route param)', () => {
    it('should list every completed module with the mark the learner got', async () => {
      await setup({});

      expect(component.overview.map((row) => row.moduleName)).toEqual([
        'Email Phishing Basics',
        'Instant Messaging Attacks',
      ]);

      const text = (fixture.nativeElement as HTMLElement).textContent;
      expect(text).toContain('Email Phishing Basics');
      expect(text).toContain('100%');
      expect(text).toContain('Instant Messaging Attacks');
      expect(text).toContain('0%');
    });

    it('should navigate to that module\'s detail view when a row is selected', async () => {
      await setup({});
      spyOn(router, 'navigate');

      component.viewModuleResult(3);

      expect(router.navigate).toHaveBeenCalledWith(['/learner/modules', 3, 'results']);
    });

    it('should show an empty-state message when the learner has completed nothing yet', async () => {
      await setup({});
      store.overrideSelector(selectMyResults, {
        moduleResults: [],
        scenarioResults: [],
        averageScore: null,
      });
      store.refreshState();
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        "You haven't completed any modules yet.",
      );
    });
  });
});
