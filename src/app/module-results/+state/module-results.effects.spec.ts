import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ModuleResultsEffects } from './module-results.effects';
import { ModuleResultsActions } from './module-results.actions';
import { ModuleResultsService } from './module-results.service';

describe('ModuleResultsEffects', () => {
  let effects: ModuleResultsEffects;
  let actions$: Observable<any>;
  let moduleResultsService: jasmine.SpyObj<ModuleResultsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ModuleResultsService', ['getModuleResult']);

    TestBed.configureTestingModule({
      providers: [
        ModuleResultsEffects,
        provideMockActions(() => actions$),
        { provide: ModuleResultsService, useValue: spy },
      ],
    });

    effects = TestBed.inject(ModuleResultsEffects);
    moduleResultsService = TestBed.inject(
      ModuleResultsService,
    ) as jasmine.SpyObj<ModuleResultsService>;
  });

  it('should dispatch fetchModuleResultSuccess with a normalized result', (done) => {
    moduleResultsService.getModuleResult.and.returnValue(
      of({ moduleId: 3, totalScore: 2, maxScore: 2 }),
    );
    actions$ = of(ModuleResultsActions.fetchModuleResult({ moduleId: 3 }));

    effects.fetchModuleResult$.subscribe((action: any) => {
      expect(moduleResultsService.getModuleResult).toHaveBeenCalledWith(3);
      expect(action.result.moduleId).toBe(3);
      expect(action.result.percentageScore).toBe(100);
      done();
    });
  });

  it('should dispatch fetchModuleResultFailure on error', (done) => {
    moduleResultsService.getModuleResult.and.returnValue(
      throwError(() => new Error('Not found')),
    );
    actions$ = of(ModuleResultsActions.fetchModuleResult({ moduleId: 3 }));

    effects.fetchModuleResult$.subscribe((action) => {
      expect(action).toEqual(
        ModuleResultsActions.fetchModuleResultFailure({ error: 'Not found' }),
      );
      done();
    });
  });
});
