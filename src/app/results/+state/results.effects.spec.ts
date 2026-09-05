import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ResultsEffects } from './results.effects';
import { ResultsActions } from './results.actions';
import { ResultsService } from './results.service';

describe('ResultsEffects', () => {
  let effects: ResultsEffects;
  let actions$: Observable<any>;
  let resultsService: jasmine.SpyObj<ResultsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ResultsService', ['getMyResults']);

    TestBed.configureTestingModule({
      providers: [
        ResultsEffects,
        provideMockActions(() => actions$),
        { provide: ResultsService, useValue: spy },
      ],
    });

    effects = TestBed.inject(ResultsEffects);
    resultsService = TestBed.inject(
      ResultsService,
    ) as jasmine.SpyObj<ResultsService>;
  });

  it('should normalize the raw response (the real { moduleResults, scenarioResults } envelope, confirmed live) and dispatch fetchMyResultsSuccess', (done) => {
    resultsService.getMyResults.and.returnValue(
      of({
        moduleResults: [],
        scenarioResults: [{ scenarioId: 1, moduleId: 1, correct: true }],
      }),
    );
    actions$ = of(ResultsActions.fetchMyResults());

    effects.fetchMyResults$.subscribe((action) => {
      expect(action).toEqual(
        ResultsActions.fetchMyResultsSuccess({
          results: {
            scenarioResults: [{ scenarioId: '1', moduleId: 1, correct: true }],
            moduleResults: [],
            averageScore: null,
          },
        }),
      );
      done();
    });
  });

  it('should dispatch fetchMyResultsFailure on error', (done) => {
    resultsService.getMyResults.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(ResultsActions.fetchMyResults());

    effects.fetchMyResults$.subscribe((action) => {
      expect(action).toEqual(
        ResultsActions.fetchMyResultsFailure({ error: 'Network error' }),
      );
      done();
    });
  });
});
