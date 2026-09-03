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
import { ModuleAttempt } from 'src/app/attempts/+state/attempt.model';
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

  // Matches the shape a learner actually receives (see scenario.model.ts) -
  // scenario ids are numeric (normalizeScenario), and the API has no
  // `options` field.
  const scenario = {
    id: 2,
    moduleId: 1,
    title: 'IT Department Software Update',
    content: 'Please install the attached update immediately.',
  };
  const scenarioList = [{ id: 1 }, scenario];

  const startedAttempt: ModuleAttempt = {
    id: 5,
    moduleId: 1,
    status: 'IN_PROGRESS',
    totalScore: 0,
    maxPossibleScore: 0,
    percentageScore: 0,
    scenariosCompleted: 0,
    totalScenarios: 0,
    passed: false,
    completedAt: null,
  };

  beforeEach(async () => {
    actionsSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [ScenarioChoiceComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '2' })),
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

  it('should always offer the fixed Safe/Suspicious decision options', () => {
    expect(component.decisionOptions).toEqual(['Safe', 'Suspicious']);
  });

  it('should start a module attempt on the first decision', () => {
    component.selectDecision('Suspicious');

    expect(component.submitting).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      AttemptsActions.startAttempt({ moduleId: 1 }),
    );
  });

  it('should submit the scenario attempt once the module attempt starts, with the cues joined as a string', () => {
    component.selectedCues = ['Urgent language', 'Suspicious link'];
    component.selectDecision('Suspicious');

    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: AttemptsActions.submitScenarioAttempt.type,
        attemptId: 5,
        scenarioAttempt: jasmine.objectContaining({
          scenarioId: 2,
          moduleId: 1,
          attemptNumber: 1,
          response: 'Suspicious',
          selectedCues: 'Urgent language,Suspicious link',
        }),
      }),
    );
  });

  it('should send an empty selectedCues string when nothing was highlighted', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: AttemptsActions.submitScenarioAttempt.type,
        attemptId: 5,
        scenarioAttempt: jasmine.objectContaining({ selectedCues: '' }),
      }),
    );
  });

  it('should reuse the in-progress attempt for a second decision in the same module without starting a new one', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));
    (store.dispatch as jasmine.Spy).calls.reset();

    component.submitting = false;
    component.selectDecision('Safe');

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: AttemptsActions.startAttempt.type }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: AttemptsActions.submitScenarioAttempt.type,
        attemptId: 5,
        scenarioAttempt: jasmine.objectContaining({ response: 'Safe' }),
      }),
    );
  });

  it('should switch to the result phase and request feedback once the scenario attempt is graded', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Suspicious',
          correct: true,
          score: 100,
          missedCues: [],
        },
      }),
    );

    expect(component.phase).toBe('result');
    expect(component.isCorrect).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: FeedbackActions.requestFeedback.type,
      }),
    );
  });

  it('should request AI feedback with the decision, selected cues and graded outcome', () => {
    component.selectedCues = ['Urgent language', 'Suspicious link'];
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Suspicious',
          correct: true,
          score: 100,
          missedCues: [],
        },
      }),
    );

    expect(store.dispatch).toHaveBeenCalledWith(
      FeedbackActions.requestFeedback({
        request: {
          scenarioContent: 'Please install the attached update immediately.',
          decision: 'Suspicious',
          correct: true,
          selectedCues: ['Urgent language', 'Suspicious link'],
          missedCues: undefined,
          attemptId: '5',
        },
      }),
    );
  });

  it('should pass the missedCues through to the feedback request', () => {
    component.selectDecision('Safe');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Safe',
          correct: false,
          score: 0,
          missedCues: ['Urgent deadline', 'Mismatched sender domain'],
        },
      }),
    );

    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        request: jasmine.objectContaining({
          missedCues: ['Urgent deadline', 'Mismatched sender domain'],
        }),
      }),
    );
  });

  it('should show incorrect result when the graded response was wrong', () => {
    component.selectDecision('Safe');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Safe',
          correct: false,
          score: 0,
          missedCues: [],
        },
      }),
    );

    expect(component.isCorrect).toBeFalse();
  });

  it('should render the missed cues for a wrong attempt', () => {
    component.selectDecision('Safe');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Safe',
          correct: false,
          score: 0,
          missedCues: ['Urgent deadline'],
        },
      }),
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cues you missed');
    expect(text).toContain('Urgent deadline');
  });

  it('should not render missed cues for a correct attempt', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));

    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptSuccess({
        result: {
          attemptId: 5,
          scenarioId: '2',
          moduleId: 1,
          response: 'Suspicious',
          correct: true,
          score: 100,
          missedCues: [],
        },
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Cues you missed');
  });

  it('should stop submitting if starting the attempt fails', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(
      AttemptsActions.startAttemptFailure({ error: 'Network error' }),
    );

    expect(component.submitting).toBeFalse();
    expect(component.phase).toBe('deciding');
  });

  it('should stop submitting if grading the scenario attempt fails', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));
    actionsSubject.next(
      AttemptsActions.submitScenarioAttemptFailure({ error: 'Network error' }),
    );

    expect(component.submitting).toBeFalse();
    expect(component.phase).toBe('deciding');
  });

  it('should navigate to the next scenario in the module', () => {
    component.scenarioId = 1;

    component.continueToNext();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });

  it('should finalize the attempt and navigate to the results screen after the last scenario', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));
    (store.dispatch as jasmine.Spy).calls.reset();
    (component as any).orderedScenarioIds = [1, 2];
    component.scenarioId = 2;

    component.continueToNext();

    expect(store.dispatch).toHaveBeenCalledWith(
      AttemptsActions.finalizeAttempt({ attemptId: 5 }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/learner/results'], {
      queryParams: { moduleId: 1 },
    });
  });

  it('should not dispatch finalizeAttempt on the results screen if no attempt was ever started', () => {
    (component as any).orderedScenarioIds = [1, 2];
    component.scenarioId = 2;

    component.continueToNext();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: AttemptsActions.finalizeAttempt.type }),
    );
  });

  it('should navigate back to the scenario page', () => {
    component.backToScenario();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });

  it('should report pager state and navigate to the previous/next scenario', () => {
    expect(component.hasPrevious).toBeTrue();
    expect(component.hasNext).toBeFalse();

    component.goToPrevious();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 1]);

    component.scenarioId = 1;
    expect(component.hasPrevious).toBeFalse();
    expect(component.hasNext).toBeTrue();

    component.goToNext();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });

  it('should finalize the attempt and close back to the module the scenario belongs to', () => {
    component.selectDecision('Suspicious');
    actionsSubject.next(AttemptsActions.startAttemptSuccess({ attempt: startedAttempt }));
    (store.dispatch as jasmine.Spy).calls.reset();

    component.closeSession();

    expect(store.dispatch).toHaveBeenCalledWith(
      AttemptsActions.finalizeAttempt({ attemptId: 5 }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules', 1]);
  });

  it('should close to the dashboard when no module is known', () => {
    component.scenario = { ...component.scenario, moduleId: undefined };

    component.closeSession();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/dashboard']);
  });

  it('should provide an icon and description for each decision option', () => {
    expect(component.getDecisionDescription('Safe')).toBe(
      'This is a legitimate message',
    );
    expect(component.getDecisionDescription('Suspicious')).toBe(
      'This looks like a phishing attempt',
    );
    expect(component.getDecisionIcon('Safe')).toBeTruthy();
  });

  it('should compute progress as the current position out of the total', () => {
    expect(component.progressPercentage).toBe(100);

    component.scenarioNumber = 1;
    component.totalScenarios = 2;
    expect(component.progressPercentage).toBe(50);
  });
});
