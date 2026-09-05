import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
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

  it('should leave difficulty/from/recipient/subject undefined when the API omits them', () => {
    expect(component.scenario.difficulty).toBeUndefined();
    expect(component.scenario.from).toBeUndefined();
    expect(component.scenario.recipient).toBeUndefined();
  });

  it('should map sender and recipient onto from/recipient when the API includes them', () => {
    store.overrideSelector(selectScenario, {
      ...scenario,
      sender: 'it-support@trulyfake.com',
      recipient: 'jane.doe@trulyfake.com',
    });
    store.refreshState();

    expect(component.scenario.from).toBe('it-support@trulyfake.com');
    expect(component.scenario.recipient).toBe('jane.doe@trulyfake.com');
  });

  it('should map the interactionType enum onto a message-shell key', () => {
    expect(component.getScenarioTypeKey()).toBe('email');

    component.scenario = { ...component.scenario, type: 'SMS' };
    expect(component.getScenarioTypeKey()).toBe('text');

    component.scenario = { ...component.scenario, type: 'CALL' };
    expect(component.getScenarioTypeKey()).toBe('phone');

    component.scenario = { ...component.scenario, type: 'SOCIAL_MEDIA' };
    expect(component.getScenarioTypeKey()).toBe('social');
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

  it('should capture a selection made over the sender/recipient/subject summary', () => {
    spyOn(window, 'getSelection').and.returnValue({
      toString: () => 'jane.doe@trulyfake.com',
      removeAllRanges: () => {},
    } as unknown as Selection);

    const summary = fixture.debugElement.query(
      By.css('.scenario-card__top'),
    );
    summary.triggerEventHandler('mouseup', {});

    expect(component.selectedCues).toContain('jane.doe@trulyfake.com');
  });

  it('should render the social media message shell with a DM thread', () => {
    component.scenario = {
      ...component.scenario,
      type: 'SOCIAL_MEDIA',
      body: 'Alex: Hey, did you see this deal?\nYou: What deal?',
    };
    fixture.detectChanges();

    const bubbles = fixture.debugElement.queryAll(
      By.css('.social-bubble'),
    );
    expect(bubbles.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Social Media DM');
    expect(fixture.nativeElement.textContent).toContain(
      'Hey, did you see this deal?',
    );
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

  it('should hide the cue selector and read "Make Your Decision" for a simple scenario', () => {
    expect(component.isDetailed).toBeFalse();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.cue-selector')).toBeNull();
    expect(nativeElement.textContent).toContain('Make Your Decision');
    expect(nativeElement.textContent).not.toContain('Submit Answer');
  });

  it('should show the cue selector and read "Submit Answer" for a detailed scenario', () => {
    store.overrideSelector(selectScenario, { ...scenario, answerMode: 'detailed' });
    store.refreshState();
    fixture.detectChanges();

    expect(component.isDetailed).toBeTrue();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.cue-selector')).not.toBeNull();
    expect(nativeElement.textContent).toContain('Submit Answer');
    expect(nativeElement.textContent).not.toContain('Make Your Decision');
  });

  it('should navigate to the feedback screen with selected cues in router state', () => {
    component.addSelectedCue('Suspicious link');
    component.makeDecision();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/learner/scenarios', 2, 'feedback'],
      { state: { selectedCues: ['Suspicious link'] } },
    );
  });

  describe('preview mode', () => {
    // Preview usage (the scenario-edit live preview) sets @Input()s before
    // the first change detection run rather than relying on the routed
    // beforeEach above, so these build their own fixture.
    function createPreviewFixture(
      previewData: Record<string, any>,
    ): ComponentFixture<ScenarioPageComponent> {
      const previewFixture = TestBed.createComponent(ScenarioPageComponent);
      previewFixture.componentInstance.previewMode = true;
      previewFixture.componentInstance.previewData = previewData;
      return previewFixture;
    }

    it('should render from previewData without dispatching or hitting the store', () => {
      (store.dispatch as jasmine.Spy).calls.reset();

      const previewFixture = createPreviewFixture({
        title: 'Draft: Suspicious Login Alert',
        content: 'We noticed a new sign-in to your account.',
        interactionType: 'EMAIL',
      });
      previewFixture.detectChanges();

      const previewComponent = previewFixture.componentInstance;
      expect(previewComponent.scenario.title).toBe(
        'Draft: Suspicious Login Alert',
      );
      expect(previewComponent.getScenarioTypeKey()).toBe('email');
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should switch message-shell layout as the interaction type changes', () => {
      const previewFixture = createPreviewFixture({
        title: 'Draft',
        content: 'Alex: Check this out\nYou: What is it?',
        interactionType: 'SOCIAL_MEDIA',
      });
      previewFixture.detectChanges();

      expect(
        previewFixture.nativeElement.querySelectorAll('.social-bubble')
          .length,
      ).toBe(2);
    });

    it('should re-render when previewData is updated', () => {
      const previewFixture = createPreviewFixture({
        title: 'First draft',
        content: 'Body',
        interactionType: 'EMAIL',
      });
      previewFixture.detectChanges();
      expect(previewFixture.componentInstance.scenario.title).toBe(
        'First draft',
      );

      previewFixture.componentInstance.previewData = {
        title: 'Second draft',
        content: 'Body',
        interactionType: 'EMAIL',
      };
      previewFixture.componentInstance.ngOnChanges({ previewData: {} as any });

      expect(previewFixture.componentInstance.scenario.title).toBe(
        'Second draft',
      );
    });

    it('should hide the decision action so the trainer preview cannot trigger learner navigation', () => {
      const previewFixture = createPreviewFixture({
        title: 'Draft',
        content: 'Body',
        interactionType: 'EMAIL',
      });
      previewFixture.detectChanges();

      expect(
        previewFixture.nativeElement.querySelector('.scenario-page__actions'),
      ).toBeNull();
    });
  });
});
