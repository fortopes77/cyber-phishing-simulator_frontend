import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LearnerProgressComponent } from './learner-progress.component';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import {
  selectMyResults,
  selectResultsError,
  selectResultsLoading,
} from 'src/app/results/+state/results.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { EMPTY_LEARNER_RESULTS, LearnerResults } from 'src/app/results/+state/results.model';

describe('LearnerProgressComponent', () => {
  let component: LearnerProgressComponent;
  let fixture: ComponentFixture<LearnerProgressComponent>;
  let store: MockStore;
  let router: Router;

  const results: LearnerResults = {
    averageScore: null,
    moduleResults: [
      { id: 10, moduleId: 1, moduleName: 'Email Basics', status: 'COMPLETED', totalScore: 1, maxScore: 2, percentageScore: 50, passed: false, completedAt: '2026-09-01T10:00:00Z' },
    ],
    scenarioResults: [
      { scenarioId: '2', moduleId: 1, correct: false, moduleResultId: 10, title: 'Parcel text', missedCues: ['Shortened link'] },
      { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 10 },
    ],
  };

  function setUp(myResults: LearnerResults) {
    TestBed.configureTestingModule({
      imports: [LearnerProgressComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectMyResults, value: myResults },
            { selector: selectResultsLoading, value: false },
            { selector: selectResultsError, value: null },
            {
              selector: selectScenarioList,
              value: [
                { id: 1, interactionType: 'EMAIL' },
                { id: 2, interactionType: 'TEXT_MESSAGE' },
              ],
            },
            { selector: selectModuleList, value: [{ moduleId: 1 }, { moduleId: 2 }] },
          ],
        }),
      ],
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(LearnerProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    store?.resetSelectors();
  });

  it("should load the learner's results, assigned modules and scenarios", () => {
    setUp(results);

    expect(store.dispatch).toHaveBeenCalledWith(ResultsActions.fetchMyResults());
    expect(store.dispatch).toHaveBeenCalledWith(ModulesActions.fetchList({ assignedToMe: true }));
    expect(store.dispatch).toHaveBeenCalledWith(ScenarioActions.fetchList({}));
  });

  it('should show the headline stats', () => {
    setUp(results);
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(text).toContain('50%');
    expect(text).toContain('1/2');
    expect(text).toContain('Total Attempts');
    expect(component.accuracy).toBe(50);
  });

  it('should render areas for improvement from missed answers', () => {
    setUp(results);
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(text).toContain('Text Message');
    expect(text).toContain('Shortened link');
    expect(text).toContain('Parcel text');
  });

  it('should list the attempt history with its status and score', () => {
    setUp(results);

    expect(component.historyRows).toEqual([
      jasmine.objectContaining({
        moduleName: 'Email Basics',
        status: 'Not Passed',
        score: '50%',
        answers: '1 / 2',
      }),
    ]);
  });

  it('should open a scenario to revisit', () => {
    setUp(results);

    component.revisitScenario('2');

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', '2']);
  });

  it('should open the module results from the attempt history', () => {
    setUp(results);

    component.historyActions[0].action(component.historyRows[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules', 1, 'results']);
  });

  it('should show an empty state before any attempts', () => {
    setUp(EMPTY_LEARNER_RESULTS);
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(component.hasActivity).toBeFalse();
    expect(text).toContain("You haven't attempted any modules yet");
    expect(text).not.toContain('Attempt History');
  });
});
