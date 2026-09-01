import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, Subject } from 'rxjs';

import { ModuleEditComponent } from './module-edit.component';
import { ModulesActions } from '../../+state/modules.actions';
import { selectModule, selectModuleList } from '../../+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';

describe('ModuleEditComponent', () => {
  let component: ModuleEditComponent;
  let fixture: ComponentFixture<ModuleEditComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  const scenarios = [
    { id: 1, title: 'Suspicious Invoice Email', moduleId: 42 },
    { id: 2, title: 'Fake Login Alert', moduleId: 99 },
  ];

  const learners = [
    {
      id: '10',
      username: 'jsmith',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'user' as const,
    },
    {
      id: '11',
      username: 'bwayne',
      firstName: 'Bruce',
      lastName: 'Wayne',
      fullName: 'Bruce Wayne',
      email: 'bruce.wayne@example.com',
      role: 'user' as const,
    },
  ];

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [ModuleEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModule, value: null },
            { selector: selectModuleList, value: [] },
            { selector: selectScenarioList, value: scenarios },
            {
              selector: selectAuthState,
              value: {
                user: {
                  id: '1',
                  username: 't',
                  email: 't@t.com',
                  role: 'trainer',
                  organisationId: 1,
                },
              },
            },
            { selector: selectUserList, value: learners },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Several tests below need moduleId populated (assign learners/scenarios
  // only makes sense once a module exists) - mirrors the existing "should
  // read the module id from the route" test's route-stubbing pattern.
  function createComponentForModule(id = '42'): void {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue(id);

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the edit form controls and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Module name');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.querySelector('.back-btn')).toBeTruthy();
  });

  it('should read the module id from the route and fetch its details', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('42');

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.moduleId).toBe(42);
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.fetchModuleDetails({ moduleId: 42 }),
    );
  });

  it('should populate the form from the already-fetched module list even if fetchModuleDetails has not resolved yet', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('42');
    store.overrideSelector(selectModuleList, [
      {
        moduleId: 42,
        moduleName: 'Phishing Awareness',
        description: 'Learn to spot phishing',
        version: '1.0.0',
      },
    ]);
    store.overrideSelector(selectModule, null);
    store.refreshState();

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.moduleForm.value).toEqual({
      moduleName: 'Phishing Awareness',
      description: 'Learn to spot phishing',
      version: '1.0.0',
    });
  });

  it('should detect create mode from the route and skip fetching details', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as any).url = [{ path: 'create' }];

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isCreateMode).toBeTrue();
  });

  it('should dispatch createModule with the form values in create mode', () => {
    component.isCreateMode = true;
    component.moduleForm.setValue({
      moduleName: 'New Module',
      description: 'A brand new module',
      version: '1.0.0',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.createModule({
        module: {
          moduleName: 'New Module',
          description: 'A brand new module',
          version: '1.0.0',
        },
      }),
    );
  });

  it('should dispatch updateModule with the form values in edit mode', () => {
    component.isCreateMode = false;
    component.moduleId = 7;
    component.moduleForm.setValue({
      moduleName: 'Updated Module',
      description: 'Updated description',
      version: '2.0.0',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.updateModule({
        moduleId: 7,
        updatedModule: {
          moduleName: 'Updated Module',
          description: 'Updated description',
          version: '2.0.0',
        },
      }),
    );
  });

  it('should not dispatch when the form is invalid', () => {
    component.moduleForm.setValue({
      moduleName: '',
      description: '',
      version: '',
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate back to the modules list on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });

  it('should navigate to the scenario library to manage scenarios', () => {
    component.manageScenarios();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/scenarios']);
  });

  it("should fetch the full scenario catalog and the org's learners once a module id is available", () => {
    createComponentForModule('42');

    expect(store.dispatch).toHaveBeenCalledWith(ScenarioActions.fetchList());
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.fetchList({ organisationId: 1 }),
    );
  });

  it('should derive the scenarios already in this module from the full catalog', () => {
    createComponentForModule('42');

    expect(component.moduleScenarios).toEqual([scenarios[0]]);
  });

  it('should filter the scenario search list by title', () => {
    createComponentForModule('42');
    component.scenarioSearch = 'fake';

    expect(component.filteredScenarios).toEqual([scenarios[1]]);
  });

  it('should filter learners by name or email', () => {
    createComponentForModule('42');
    component.learnerSearch = 'bruce';

    expect(component.filteredLearners).toEqual([learners[1]]);
  });

  it('should dispatch assignLearner with this module id and a numeric user id', () => {
    createComponentForModule('42');

    component.assignLearner(learners[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.assignLearner({ moduleId: 42, userId: 10 }),
    );
    expect(component.assigningLearnerIds.has(10)).toBeTrue();
  });

  it('should mark a learner as added once assignLearnerSuccess fires', () => {
    actions$ = of(
      ModulesActions.assignLearnerSuccess({ moduleId: 42, userId: 10 }),
    );

    createComponentForModule('42');

    expect(component.addedLearnerIds.has(10)).toBeTrue();
  });

  it('should surface an error message if assignLearnerFailure fires', () => {
    actions$ = of(
      ModulesActions.assignLearnerFailure({
        userId: 10,
        error: 'Learner is already assigned to this module',
      }),
    );

    createComponentForModule('42');

    expect(component.learnerAssignError).toBe(
      'Learner is already assigned to this module',
    );
  });

  it("should dispatch updateScenario with this module's id to reassign a scenario", () => {
    createComponentForModule('42');

    component.assignScenario(scenarios[1]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.updateScenario({
        scenarioId: '2',
        updatedScenario: { ...scenarios[1], moduleId: 42 },
      }),
    );
  });

  it('should not reassign a scenario that is already in this module', () => {
    createComponentForModule('42');

    component.assignScenario(scenarios[0]);

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ScenarioActions.updateScenario.type }),
    );
  });

  it('should refetch the scenario catalog once a reassignment succeeds', () => {
    actions$ = of(ScenarioActions.updateScenarioSuccess({ scenario: {} }));

    createComponentForModule('42');

    expect(store.dispatch).toHaveBeenCalledWith(ScenarioActions.fetchList());
  });

  it('should dispatch updateScenario with a null moduleId to unassign a scenario already in this module', () => {
    createComponentForModule('42');

    component.unassignScenario(scenarios[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.updateScenario({
        scenarioId: '1',
        updatedScenario: { ...scenarios[0], moduleId: null },
      }),
    );
  });

  it('should not unassign a scenario that is not in this module', () => {
    createComponentForModule('42');

    component.unassignScenario(scenarios[1]);

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ScenarioActions.updateScenario.type }),
    );
  });

  it('should assign via toggleScenario when the scenario is not yet in this module', () => {
    createComponentForModule('42');

    component.toggleScenario(scenarios[1]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.updateScenario({
        scenarioId: '2',
        updatedScenario: { ...scenarios[1], moduleId: 42 },
      }),
    );
  });

  it('should unassign via toggleScenario when the scenario is already in this module', () => {
    createComponentForModule('42');

    component.toggleScenario(scenarios[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.updateScenario({
        scenarioId: '1',
        updatedScenario: { ...scenarios[0], moduleId: null },
      }),
    );
  });

  it('should render a toggle for each scenario reflecting whether it is already in this module', () => {
    createComponentForModule('42');
    const compiled = fixture.nativeElement as HTMLElement;

    const toggles = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>(
        '.scenario-assign-panel .assign-row .toggle-switch',
      ),
    );

    expect(toggles.length).toBe(2);
    expect(toggles[0].classList.contains('on')).toBeTrue();
    expect(toggles[1].classList.contains('on')).toBeFalse();

    toggles[0].click();

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.updateScenario({
        scenarioId: '1',
        updatedScenario: { ...scenarios[0], moduleId: null },
      }),
    );
  });

  it('should render a search box and a toggle for each learner and assign one on click', () => {
    createComponentForModule('42');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Jane Smith');
    expect(compiled.textContent).toContain('Bruce Wayne');

    const toggles = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>(
        '.learner-assign-panel .assign-row .toggle-switch',
      ),
    );
    toggles[0].click();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.assignLearner({ moduleId: 42, userId: 10 }),
    );
  });

  it('should dispatch unassignLearner when toggling off a learner already added this session', () => {
    createComponentForModule('42');
    component.addedLearnerIds.add(10);

    component.toggleLearner(learners[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.unassignLearner({ moduleId: 42, userId: 10 }),
    );
  });

  it('should dispatch assignLearner when toggling on a learner not yet added', () => {
    createComponentForModule('42');

    component.toggleLearner(learners[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.assignLearner({ moduleId: 42, userId: 10 }),
    );
  });

  it('should remove a learner from addedLearnerIds once unassignLearnerSuccess fires', () => {
    const liveActions$ = new Subject<any>();
    actions$ = liveActions$;

    createComponentForModule('42');
    component.addedLearnerIds.add(10);

    liveActions$.next(
      ModulesActions.unassignLearnerSuccess({ moduleId: 42, userId: 10 }),
    );

    expect(component.addedLearnerIds.has(10)).toBeFalse();
  });

  it('should open the delete confirmation modal when Delete Module is clicked', () => {
    createComponentForModule('42');

    component.handleDeleteModule();

    expect(component.isDeleteModalOpen).toBeTrue();
  });

  it('should dispatch deleteModule for this module id on confirm', () => {
    createComponentForModule('42');
    component.isDeleteModalOpen = true;

    component.confirmDeleteModule();

    expect(component.isDeleteModalOpen).toBeFalse();
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.deleteModule({ moduleId: 42 }),
    );
  });

  it('should close the delete modal without dispatching on cancel', () => {
    createComponentForModule('42');
    component.isDeleteModalOpen = true;

    component.cancelDeleteModule();

    expect(component.isDeleteModalOpen).toBeFalse();
    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ModulesActions.deleteModule.type }),
    );
  });

  it('should navigate back to the modules list once the module is deleted', () => {
    actions$ = of(ModulesActions.deleteModuleSuccess({ moduleId: 42 }));

    createComponentForModule('42');

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });

  it('should navigate back to the modules list when the back button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.back-btn')!.click();

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });
});
