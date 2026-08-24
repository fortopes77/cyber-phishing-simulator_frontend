import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Actions } from '@ngrx/effects';
import { Subject, of } from 'rxjs';
import { ScenarioChoiceComponent } from './scenario-choice.component';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import {
  selectFeedback,
  selectFeedbackLoading,
} from 'src/app/feedback/+state/feedback.selectors';
import { FeedbackActions } from 'src/app/feedback/+state/feedback.actions';

describe('ScenarioChoiceComponent', () => {
  let component: ScenarioChoiceComponent;
  let fixture: ComponentFixture<ScenarioChoiceComponent>;
  let store: MockStore;
  let router: Router;
  // A real Subject (rather than provideMockActions) so tests can push
  // actions into the already-subscribed component mid-test, simulating an
  // effect completing after the initial ngOnInit subscription is set up.
  let actionsSubject: Subject<any>;

  const scenario = {
    id: 's_002',
    moduleId: 1,
    title: 'IT Department Software Update',
    sender: 'it-support@yourcompany.com',
    content: 'Please install the attached update immediately.',
    options: ['Report', 'Ignore', 'Open Link'],
  };
  const scenarioList = [{ id: 's_001' }, scenario];

  beforeEach(async () => {
    actionsSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [ScenarioChoiceComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 's_002' })),
          },
        },
        { provide: Actions, useValue: actionsSubject },
        provideMockStore({
          selectors: [
            { selector: selectScenario, value: scenario },
            { selector: selectScenarioList, value: scenarioList },
            { selector: selectFeedback, value: null },
            { selector: selectFeedbackLoading, value: false },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ScenarioChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the scenario and derive its position in the module', () => {
    expect(component.scenario.title).toBe('IT Department Software Update');
    expect(component.scenarioNumber).toBe(2);
    expect(component.totalScenarios).toBe(2);
  });

  it('should use the scenario-provided decision options', () => {
    expect(component.scenario.options).toEqual([
      'Report',
      'Ignore',
      'Open Link',
    ]);
  });

  it('should dispatch createAttempt when a decision is selected', () => {
    component.selectDecision('Report');

    expect(component.submitting).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      AttemptsActions.createAttempt({
        attempt: { scenarioId: 's_002', decision: 'Report' },
      }),
    );
  });

  it('should switch to the result phase and request feedback on createAttemptSuccess', () => {
    component.selectDecision('Report');

    const attempt = {
      id: 'a_1',
      scenarioId: 's_002',
      decision: 'Report',
      correct: true,
    };
    actionsSubject.next(AttemptsActions.createAttemptSuccess({ attempt }));

    expect(component.phase).toBe('result');
    expect(component.isCorrect).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: FeedbackActions.requestFeedback.type,
      }),
    );
  });

  it('should show incorrect result when the attempt was wrong', () => {
    component.selectDecision('Open Link');

    actionsSubject.next(
      AttemptsActions.createAttemptSuccess({
        attempt: {
          id: 'a_2',
          scenarioId: 's_002',
          decision: 'Open Link',
          correct: false,
        },
      }),
    );

    expect(component.isCorrect).toBeFalse();
  });

  it('should stop submitting on createAttemptFailure', () => {
    component.selectDecision('Report');
    actionsSubject.next(
      AttemptsActions.createAttemptFailure({ error: 'Network error' }),
    );

    expect(component.submitting).toBeFalse();
    expect(component.phase).toBe('deciding');
  });

  it('should navigate to the next scenario in the module', () => {
    component.scenarioId = 's_001';

    component.continueToNext();

    expect(router.navigate).toHaveBeenCalledWith([
      '/learner/scenarios',
      's_002',
    ]);
  });

  it('should navigate to the results screen after the last scenario', () => {
    component.selectedDecision = 'Report';
    (component as any).orderedScenarioIds = ['s_001', 's_002'];
    component.scenarioId = 's_002';

    component.continueToNext();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/results'], {
      queryParams: { moduleId: 1 },
    });
  });

  it('should navigate back to the scenario page', () => {
    component.backToScenario();

    expect(router.navigate).toHaveBeenCalledWith([
      '/learner/scenarios',
      's_002',
    ]);
  });
});
