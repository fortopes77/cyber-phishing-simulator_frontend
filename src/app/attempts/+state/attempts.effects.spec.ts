import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { AttemptsEffects } from './attempts.effects';
import { AttemptsActions } from './attempts.actions';
import { AttemptsService } from './attempts.service';
import { ScenarioAttemptInput } from './attempt.model';

describe('AttemptsEffects', () => {
  let effects: AttemptsEffects;
  let actions$: Observable<any>;
  let attemptsService: jasmine.SpyObj<AttemptsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AttemptsService', [
      'startAttempt',
      'submitScenarioAttempt',
      'finalizeAttempt',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AttemptsEffects,
        provideMockActions(() => actions$),
        { provide: AttemptsService, useValue: spy },
      ],
    });

    effects = TestBed.inject(AttemptsEffects);
    attemptsService = TestBed.inject(
      AttemptsService,
    ) as jasmine.SpyObj<AttemptsService>;
  });

  describe('startAttempt$', () => {
    it('should start the attempt and normalize the snake_case response', (done) => {
      attemptsService.startAttempt.and.returnValue(
        of({
          id: 1,
          moduleId: 2,
          status: 'IN_PROGRESS',
          total_score: 0,
          max_possible_score: 0,
          percentage_score: 0,
          scenarios_completed: 0,
          total_scenarios: 0,
          passed: false,
          completedAt: null,
        }),
      );
      actions$ = of(AttemptsActions.startAttempt({ moduleId: 2 }));

      effects.startAttempt$.subscribe((action) => {
        expect(attemptsService.startAttempt).toHaveBeenCalledWith(2);
        expect(action).toEqual(
          AttemptsActions.startAttemptSuccess({
            attempt: {
              id: 1,
              moduleId: 2,
              status: 'IN_PROGRESS',
              totalScore: 0,
              maxPossibleScore: 0,
              percentageScore: 0,
              scenariosCompleted: 0,
              totalScenarios: 0,
              passed: false,
              completedAt: null,
            },
          }),
        );
        done();
      });
    });

    it('should dispatch startAttemptFailure on error', (done) => {
      attemptsService.startAttempt.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(AttemptsActions.startAttempt({ moduleId: 2 }));

      effects.startAttempt$.subscribe((action) => {
        expect(action).toEqual(
          AttemptsActions.startAttemptFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('submitScenarioAttempt$', () => {
    const scenarioAttempt: ScenarioAttemptInput = {
      scenarioId: 1,
      moduleId: 2,
      attemptNumber: 1,
      response: 'Suspicious',
      startedAt: '2026-09-02T00:00:00.000Z',
      completedAt: '2026-09-02T00:00:12.000Z',
      selectedCues: '',
    };

    it('should submit the scenario answer and normalize the graded response', (done) => {
      attemptsService.submitScenarioAttempt.and.returnValue(
        of({
          attemptId: 1,
          scenarioId: 1,
          moduleId: 2,
          response: 'Suspicious',
          isCorrect: true,
          score: 100,
          missedCues: [],
        }),
      );
      actions$ = of(
        AttemptsActions.submitScenarioAttempt({ attemptId: 1, scenarioAttempt }),
      );

      effects.submitScenarioAttempt$.subscribe((action) => {
        expect(attemptsService.submitScenarioAttempt).toHaveBeenCalledWith(
          1,
          scenarioAttempt,
        );
        expect(action).toEqual(
          AttemptsActions.submitScenarioAttemptSuccess({
            result: {
              attemptId: 1,
              scenarioId: '1',
              moduleId: 2,
              response: 'Suspicious',
              correct: true,
              score: 100,
              missedCues: [],
            },
          }),
        );
        done();
      });
    });

    it('should dispatch submitScenarioAttemptFailure on error', (done) => {
      attemptsService.submitScenarioAttempt.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(
        AttemptsActions.submitScenarioAttempt({ attemptId: 1, scenarioAttempt }),
      );

      effects.submitScenarioAttempt$.subscribe((action) => {
        expect(action).toEqual(
          AttemptsActions.submitScenarioAttemptFailure({
            error: 'Network error',
          }),
        );
        done();
      });
    });
  });

  describe('finalizeAttempt$', () => {
    it('should finalize the attempt and normalize the completed response', (done) => {
      attemptsService.finalizeAttempt.and.returnValue(
        of({
          id: 1,
          moduleId: 2,
          status: 'COMPLETED',
          total_score: 1,
          max_possible_score: 1,
          percentage_score: 100,
          scenarios_completed: 1,
          total_scenarios: 1,
          passed: true,
          completedAt: '2026-09-02T00:21:44.856Z',
        }),
      );
      actions$ = of(AttemptsActions.finalizeAttempt({ attemptId: 1 }));

      effects.finalizeAttempt$.subscribe((action) => {
        expect(attemptsService.finalizeAttempt).toHaveBeenCalledWith(1);
        expect(action).toEqual(
          AttemptsActions.finalizeAttemptSuccess({
            attempt: {
              id: 1,
              moduleId: 2,
              status: 'COMPLETED',
              totalScore: 1,
              maxPossibleScore: 1,
              percentageScore: 100,
              scenariosCompleted: 1,
              totalScenarios: 1,
              passed: true,
              completedAt: '2026-09-02T00:21:44.856Z',
            },
          }),
        );
        done();
      });
    });

    it('should dispatch finalizeAttemptFailure on error', (done) => {
      attemptsService.finalizeAttempt.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(AttemptsActions.finalizeAttempt({ attemptId: 1 }));

      effects.finalizeAttempt$.subscribe((action) => {
        expect(action).toEqual(
          AttemptsActions.finalizeAttemptFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });
});
