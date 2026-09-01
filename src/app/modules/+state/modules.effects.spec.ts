import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ModulesEffects } from './modules.effects';
import { ModulesActions } from './modules.actions';
import { ModulesService } from './modules.service';
import { LearnerModule } from './module.model';

describe('ModulesEffects', () => {
  let effects: ModulesEffects;
  let actions$: Observable<any>;
  let modulesService: jasmine.SpyObj<ModulesService>;

  const modules: LearnerModule[] = [
    { moduleId: 1, moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];

  const module: LearnerModule = {
    moduleId: 1,
    moduleName: 'Phishing Awareness',
    description: 'Learn to spot phishing',
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ModulesService', [
      'getModules',
      'getModuleDetails',
      'createModule',
      'updateModule',
      'deleteModule',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ModulesEffects,
        provideMockActions(() => actions$),
        { provide: ModulesService, useValue: spy },
      ],
    });

    effects = TestBed.inject(ModulesEffects);
    modulesService = TestBed.inject(
      ModulesService,
    ) as jasmine.SpyObj<ModulesService>;
  });

  it('should pass the userId from the action through to the service', (done) => {
    modulesService.getModules.and.returnValue(of(modules));
    actions$ = of(ModulesActions.fetchList({ userId: 'u_1' }));

    effects.fetchModules$.subscribe((action) => {
      expect(modulesService.getModules).toHaveBeenCalledWith('u_1');
      expect(action).toEqual(ModulesActions.fetchListSuccess({ modules }));
      done();
    });
  });

  it('should dispatch fetchListSuccess with a wrapped response', (done) => {
    modulesService.getModules.and.returnValue(of({ modules }));
    actions$ = of(ModulesActions.fetchList({}));

    effects.fetchModules$.subscribe((action) => {
      expect(action).toEqual(ModulesActions.fetchListSuccess({ modules }));
      done();
    });
  });

  it('should normalize a module whose id came back as `id` instead of `moduleId`', (done) => {
    modulesService.getModules.and.returnValue(
      of([
        { id: 7, moduleName: 'Email Security', description: 'desc' } as any,
      ]),
    );
    actions$ = of(ModulesActions.fetchList({}));

    effects.fetchModules$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.fetchListSuccess({
          modules: [
            {
              id: 7,
              moduleId: 7,
              moduleName: 'Email Security',
              description: 'desc',
            } as any,
          ],
        }),
      );
      done();
    });
  });

  it('should dispatch fetchListFailure on error', (done) => {
    modulesService.getModules.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(ModulesActions.fetchList({}));

    effects.fetchModules$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.fetchListFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch fetchModuleDetailsSuccess on fetch', (done) => {
    modulesService.getModuleDetails.and.returnValue(of(module));
    actions$ = of(ModulesActions.fetchModuleDetails({ moduleId: 1 }));

    effects.fetchModuleDetails$.subscribe((action) => {
      expect(modulesService.getModuleDetails).toHaveBeenCalledWith(1);
      expect(action).toEqual(
        ModulesActions.fetchModuleDetailsSuccess({ module }),
      );
      done();
    });
  });

  it('should dispatch fetchModuleDetailsFailure on error', (done) => {
    modulesService.getModuleDetails.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(ModulesActions.fetchModuleDetails({ moduleId: 1 }));

    effects.fetchModuleDetails$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.fetchModuleDetailsFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch createModuleSuccess on create', (done) => {
    modulesService.createModule.and.returnValue(of(module));
    actions$ = of(ModulesActions.createModule({ module }));

    effects.createModule$.subscribe((action) => {
      expect(modulesService.createModule).toHaveBeenCalledWith(module);
      expect(action).toEqual(ModulesActions.createModuleSuccess({ module }));
      done();
    });
  });

  it('should dispatch createModuleFailure on error', (done) => {
    modulesService.createModule.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(ModulesActions.createModule({ module }));

    effects.createModule$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.createModuleFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch updateModuleSuccess on update', (done) => {
    modulesService.updateModule.and.returnValue(of(module));
    actions$ = of(
      ModulesActions.updateModule({ moduleId: 1, updatedModule: module }),
    );

    effects.updateModule$.subscribe((action) => {
      expect(modulesService.updateModule).toHaveBeenCalledWith(1, module);
      expect(action).toEqual(ModulesActions.updateModuleSuccess({ module }));
      done();
    });
  });

  it('should dispatch updateModuleFailure on error', (done) => {
    modulesService.updateModule.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(
      ModulesActions.updateModule({ moduleId: 1, updatedModule: module }),
    );

    effects.updateModule$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.updateModuleFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch deleteModuleSuccess on delete', (done) => {
    modulesService.deleteModule.and.returnValue(of({}));
    actions$ = of(ModulesActions.deleteModule({ moduleId: 1 }));

    effects.deleteModule$.subscribe((action) => {
      expect(modulesService.deleteModule).toHaveBeenCalledWith(1);
      expect(action).toEqual(ModulesActions.deleteModuleSuccess({ moduleId: 1 }));
      done();
    });
  });

  it('should dispatch deleteModuleFailure on error', (done) => {
    modulesService.deleteModule.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(ModulesActions.deleteModule({ moduleId: 1 }));

    effects.deleteModule$.subscribe((action) => {
      expect(action).toEqual(
        ModulesActions.deleteModuleFailure({ error: 'Network error' }),
      );
      done();
    });
  });
});
