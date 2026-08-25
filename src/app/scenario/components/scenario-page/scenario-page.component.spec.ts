import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ScenarioPageComponent } from './scenario-page.component';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';

describe('ScenarioPageComponent', () => {
  let component: ScenarioPageComponent;
  let fixture: ComponentFixture<ScenarioPageComponent>;
  let router: Router;
  let store: MockStore;

  // Matches the shape a learner actually receives from the Read endpoint
  // per the scenarios ticket: scenarioId, moduleId, title, content,
  // interactionType only - no difficulty/sender/subject/correctCues.
  const scenario = {
    id: 2,
    moduleId: 1,
    title: 'Urgent Password Reset',
    interactionType: 'EMAIL',
    content:
      'Please reset your password immediately using the secure link below.',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioPageComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '2' })),
          },
        },
        provideMockStore({
          selectors: [
            { selector: selectScenario, value: scenario },
            { selector: selectScenarioList, value: [{ id: 1 }, scenario] },
          ],
        }),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(router, 'navigate');
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(ScenarioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch fetchScenarioDetails for the routed id', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({ scenarioId: '2' }),
    );
  });

  it('should map the store scenario onto the local view model', () => {
    expect(component.scenarioId).toBe(2);
    expect(component.scenario.title).toContain('Urgent Password Reset');
    expect(component.scenario.type).toBe('EMAIL');
    expect(component.scenario.moduleId).toBe(1);
  });

  it('should leave difficulty/from/subject undefined when the API omits them', () => {
    expect(component.scenario.difficulty).toBeUndefined();
    expect(component.scenario.from).toBeUndefined();
  });

  it('should map the interactionType enum onto a message-shell key', () => {
    expect(component.getScenarioTypeKey()).toBe('email');

    component.scenario = { ...component.scenario, type: 'SMS' };
    expect(component.getScenarioTypeKey()).toBe('text');

    component.scenario = { ...component.scenario, type: 'CALL' };
    expect(component.getScenarioTypeKey()).toBe('phone');
  });

  it('should dispatch fetchScenariosByModule once the scenario moduleId is known', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      ScenarioActions.fetchScenariosByModule({ moduleId: 1 }),
    );
  });

  it('should derive scenario position from the loaded module scenario list', () => {
    expect(component.scenarioNumber).toBe(2);
    expect(component.totalScenarios).toBe(2);
  });

  it('should add highlighted content text to selected cues on mouseup', () => {
    spyOn(window, 'getSelection').and.returnValue({
      toString: () => '  Suspicious urgent request  ',
      removeAllRanges: () => {},
    } as unknown as Selection);

    component.onContentMouseUp();

    expect(component.selectedCues).toContain('Suspicious urgent request');
  });

  it('should not add an empty selection to selected cues', () => {
    spyOn(window, 'getSelection').and.returnValue({
      toString: () => '   ',
      removeAllRanges: () => {},
    } as unknown as Selection);

    component.onContentMouseUp();

    expect(component.selectedCues.length).toBe(0);
  });

  it('should not add duplicate cues', () => {
    component.addSelectedCue('Urgent language');
    component.addSelectedCue('Urgent language');

    expect(
      component.selectedCues.filter((cue) => cue === 'Urgent language')
        .length,
    ).toBe(1);
  });

  it('should remove a selected cue', () => {
    component.addSelectedCue('Urgent language');
    component.removeSelectedCue('Urgent language');

    expect(component.selectedCues).not.toContain('Urgent language');
  });

  it('should navigate to the feedback screen with selected cues in router state', () => {
    component.addSelectedCue('Suspicious link');
    component.makeDecision();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/learner/scenarios', 2, 'feedback'],
      { state: { selectedCues: ['Suspicious link'] } },
    );
  });
});
