import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { AttemptsEffects } from './attempts.effects';
import { AttemptsActions } from './attempts.actions';
import { AttemptsService } from './attempts.service';

describe('AttemptsEffects', () => {
  let effects: AttemptsEffects;
  let actions$: Observable<any>;
  let attemptsService: jasmine.SpyObj<AttemptsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AttemptsService', [
      'getUserAttempts',
      'createAttempt',
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

  it('should dispatch fetchUserAttemptsSuccess when the API returns an array', (done) => {
    const attempts = [
      { id: 'a1', scenarioId: 's_001', decision: 'Report', correct: true },
    ];
    attemptsService.getUserAttempts.and.returnValue(of(attempts));
    actions$ = of(AttemptsActions.fetchUserAttempts());

    effects.fetchUserAttempts$.subscribe((action) => {
      expect(action).toEqual(
        AttemptsActions.fetchUserAttemptsSuccess({ attempts }),
      );
      done();
    });
  });

  it('should dispatch fetchUserAttemptsSuccess when the API returns a wrapped object', (done) => {
    const attempts = [
      { id: 'a1', scenarioId: 's_001', decision: 'Report', correct: true },
    ];
    attemptsService.getUserAttempts.and.returnValue(of({ attempts }));
    actions$ = of(AttemptsActions.fetchUserAttempts());

    effects.fetchUserAttempts$.subscribe((action) => {
      expect(action).toEqual(
        AttemptsActions.fetchUserAttemptsSuccess({ attempts }),
      );
      done();
    });
  });

  it('should dispatch fetchUserAttemptsFailure on error', (done) => {
    attemptsService.getUserAttempts.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(AttemptsActions.fetchUserAttempts());

    effects.fetchUserAttempts$.subscribe((action) => {
      expect(action).toEqual(
        AttemptsActions.fetchUserAttemptsFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch createAttemptSuccess on successful create', (done) => {
    const attempt = {
      id: 'a1',
      scenarioId: 's_001',
      decision: 'Report',
      correct: true,
    };
    attemptsService.createAttempt.and.returnValue(
      of({ success: true, attempt }),
    );
    actions$ = of(AttemptsActions.createAttempt({ attempt }));

    effects.createAttempt$.subscribe((action) => {
      expect(action).toEqual(AttemptsActions.createAttemptSuccess({ attempt }));
      done();
    });
  });

  it('should dispatch createAttemptFailure on error', (done) => {
    attemptsService.createAttempt.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(AttemptsActions.createAttempt({ attempt: {} }));

    effects.createAttempt$.subscribe((action) => {
      expect(action).toEqual(
        AttemptsActions.createAttemptFailure({ error: 'Network error' }),
      );
      done();
    });
  });
});
