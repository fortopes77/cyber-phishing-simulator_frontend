import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ScenarioEffects } from './scenario.effects';
import { ScenarioActions } from './scenario.actions';
import { ScenarioService } from './scenario.service';

describe('ScenarioEffects', () => {
  let effects: ScenarioEffects;
  let actions$: Observable<any>;
  let scenarioService: jasmine.SpyObj<ScenarioService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ScenarioService', [
      'getScenarios',
      'getScenariosByModule',
      'getScenarioDetails',
      'createScenario',
      'createScenarioWithAI',
      'updateScenario',
      'deleteScenario',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ScenarioEffects,
        provideMockActions(() => actions$),
        { provide: ScenarioService, useValue: spy },
      ],
    });

    effects = TestBed.inject(ScenarioEffects);
    scenarioService = TestBed.inject(
      ScenarioService,
    ) as jasmine.SpyObj<ScenarioService>;
  });

  describe('fetchScenarios$', () => {
    it("should normalize each scenario's scenarioId onto id - the real GET /scenarios shape, confirmed live", (done) => {
      scenarioService.getScenarios.and.returnValue(
        of([{ scenarioId: 1, moduleId: 1, title: 'Fake Invoice', content: '...' }]),
      );
      actions$ = of(ScenarioActions.fetchList());

      effects.fetchScenarios$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.fetchListSuccess({
            scenarios: [
              {
                scenarioId: 1,
                moduleId: 1,
                title: 'Fake Invoice',
                content: '...',
                id: 1,
                answerMode: 'simple',
              },
            ],
          }),
        );
        done();
      });
    });

    it('should dispatch fetchListFailure on error', (done) => {
      scenarioService.getScenarios.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(ScenarioActions.fetchList());

      effects.fetchScenarios$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.fetchListFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('fetchScenariosByModule$', () => {
    it('should normalize scenarioId onto id for a module-scoped fetch', (done) => {
      scenarioService.getScenariosByModule.and.returnValue(
        of([{ scenarioId: 3, moduleId: 2, title: 'Suspicious Login' }]),
      );
      actions$ = of(ScenarioActions.fetchScenariosByModule({ moduleId: 2 }));

      effects.fetchScenariosByModule$.subscribe((action) => {
        expect(scenarioService.getScenariosByModule).toHaveBeenCalledWith(2);
        expect(action).toEqual(
          ScenarioActions.fetchScenariosByModuleSuccess({
            scenarios: [
              {
                scenarioId: 3,
                moduleId: 2,
                title: 'Suspicious Login',
                id: 3,
                answerMode: 'simple',
              },
            ],
          }),
        );
        done();
      });
    });

    it('should dispatch fetchScenariosByModuleFailure on error', (done) => {
      scenarioService.getScenariosByModule.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(ScenarioActions.fetchScenariosByModule({ moduleId: 2 }));

      effects.fetchScenariosByModule$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.fetchScenariosByModuleFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('fetchScenarioDetails$', () => {
    it('should normalize scenarioId onto id for a single scenario fetch', (done) => {
      scenarioService.getScenarioDetails.and.returnValue(
        of({ scenarioId: 1, moduleId: 1, title: 'Fake Invoice' }),
      );
      actions$ = of(ScenarioActions.fetchScenarioDetails({ scenarioId: '1' }));

      effects.fetchScenarioDetails$.subscribe((action) => {
        expect(scenarioService.getScenarioDetails).toHaveBeenCalledWith('1');
        expect(action).toEqual(
          ScenarioActions.fetchScenarioDetailsSuccess({
            scenario: {
              scenarioId: 1,
              moduleId: 1,
              title: 'Fake Invoice',
              id: 1,
              answerMode: 'simple',
            },
          }),
        );
        done();
      });
    });

    it('should dispatch fetchScenarioDetailsFailure on error', (done) => {
      scenarioService.getScenarioDetails.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(ScenarioActions.fetchScenarioDetails({ scenarioId: '1' }));

      effects.fetchScenarioDetails$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.fetchScenarioDetailsFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('createScenario$', () => {
    it('should normalize the created scenario', (done) => {
      const scenario = { moduleId: 1, title: 'New scenario' };
      scenarioService.createScenario.and.returnValue(
        of({ scenarioId: 9, moduleId: 1, title: 'New scenario' }),
      );
      actions$ = of(ScenarioActions.createScenario({ scenario }));

      effects.createScenario$.subscribe((action) => {
        expect(scenarioService.createScenario).toHaveBeenCalledWith(scenario);
        expect(action).toEqual(
          ScenarioActions.createScenarioSuccess({
            scenario: {
              scenarioId: 9,
              moduleId: 1,
              title: 'New scenario',
              id: 9,
              answerMode: 'simple',
            },
          }),
        );
        done();
      });
    });

    it('should dispatch createScenarioFailure on error', (done) => {
      scenarioService.createScenario.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(ScenarioActions.createScenario({ scenario: {} }));

      effects.createScenario$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.createScenarioFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('updateScenario$', () => {
    it('should normalize the updated scenario', (done) => {
      const updatedScenario = { moduleId: 2, title: 'Updated scenario' };
      scenarioService.updateScenario.and.returnValue(
        of({ scenarioId: 9, moduleId: 2, title: 'Updated scenario' }),
      );
      actions$ = of(
        ScenarioActions.updateScenario({ scenarioId: '9', updatedScenario }),
      );

      effects.updateScenario$.subscribe((action) => {
        expect(scenarioService.updateScenario).toHaveBeenCalledWith(
          '9',
          updatedScenario,
        );
        expect(action).toEqual(
          ScenarioActions.updateScenarioSuccess({
            scenario: {
              scenarioId: 9,
              moduleId: 2,
              title: 'Updated scenario',
              id: 9,
              answerMode: 'simple',
            },
          }),
        );
        done();
      });
    });

    it('should dispatch updateScenarioFailure on error', (done) => {
      scenarioService.updateScenario.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(
        ScenarioActions.updateScenario({ scenarioId: '9', updatedScenario: {} }),
      );

      effects.updateScenario$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.updateScenarioFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });

  describe('deleteScenario$', () => {
    it('should dispatch deleteScenarioSuccess on delete', (done) => {
      scenarioService.deleteScenario.and.returnValue(of({}));
      actions$ = of(ScenarioActions.deleteScenario({ scenarioId: '9' }));

      effects.deleteScenario$.subscribe((action) => {
        expect(scenarioService.deleteScenario).toHaveBeenCalledWith('9');
        expect(action).toEqual(
          ScenarioActions.deleteScenarioSuccess({ scenarioId: '9' }),
        );
        done();
      });
    });

    it('should dispatch deleteScenarioFailure on error', (done) => {
      scenarioService.deleteScenario.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      actions$ = of(ScenarioActions.deleteScenario({ scenarioId: '9' }));

      effects.deleteScenario$.subscribe((action) => {
        expect(action).toEqual(
          ScenarioActions.deleteScenarioFailure({ error: 'Network error' }),
        );
        done();
      });
    });
  });
});
