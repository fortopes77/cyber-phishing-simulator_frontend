import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { ScenarioListComponent } from './scenario-list.component';
import { ScenarioActions } from '../../+state/scenario.actions';
import { selectScenarioList } from '../../+state/scenario.selectors';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';

describe('ScenarioListComponent', () => {
  let component: ScenarioListComponent;
  let fixture: ComponentFixture<ScenarioListComponent>;
  let router: Router;
  let store: MockStore;
  let actions$: Observable<any>;

  const modules = [
    { moduleId: 1, moduleName: 'Email Phishing Basics', description: '' },
    { moduleId: 2, moduleName: 'Business Email Compromise', description: '' },
  ];

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [ScenarioListComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectScenarioList, value: [] },
            { selector: selectModuleList, value: modules },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the scenario edit page when the edit action is triggered', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.actions[0].action({ id: 42 } as Record<string, unknown>);

    expect(navigateSpy).toHaveBeenCalledWith(['/trainer/scenarios', '42', 'edit']);
  });

  it('should fetch the module catalog on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(ModulesActions.fetchList({}));
  });

  it('should populate modules from the store', () => {
    expect(component.modules).toEqual([
      { moduleId: 1, moduleName: 'Email Phishing Basics' },
      { moduleId: 2, moduleName: 'Business Email Compromise' },
    ]);
  });

  it('should open the select-module modal instead of immediately generating when "Create with AI" is clicked', () => {
    component.createActions[0].action();

    expect(component.isSelectModuleModalOpen).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalledWith(ScenarioActions.createAIScenario());
  });

  it('should dispatch createAIScenario and track the chosen module once a module is confirmed', () => {
    component.createActions[0].action();

    component.confirmSelectModule(2);

    expect(component.isSelectModuleModalOpen).toBeFalse();
    expect(component.pendingAiModuleId).toBe(2);
    expect(component.isCreatingWithAi).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(ScenarioActions.createAIScenario());
  });

  it('should close the modal without dispatching createAIScenario on cancel', () => {
    component.createActions[0].action();

    component.cancelSelectModule();

    expect(component.isSelectModuleModalOpen).toBeFalse();
    expect(store.dispatch).not.toHaveBeenCalledWith(ScenarioActions.createAIScenario());
  });

  it("should merge the confirmed module id into the AI-generated scenario before dispatching createScenario - the AI API doesn't know about modules, only the backend create call needs one", () => {
    actions$ = of(
      ScenarioActions.createAIScenarioSuccess({
        scenario: { title: 'AI generated scenario', content: 'Some email body' },
      }),
    );
    fixture = TestBed.createComponent(ScenarioListComponent);
    component = fixture.componentInstance;
    // Set before detectChanges() runs ngOnInit (and its actions$ subscription
    // that immediately receives the queued createAIScenarioSuccess above) -
    // mirrors what confirmSelectModule() would have set moments earlier.
    component.pendingAiModuleId = 2;
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.createScenario({
        scenario: { title: 'AI generated scenario', content: 'Some email body', moduleId: 2 },
      }),
    );
  });
});
