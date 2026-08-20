import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ScenarioPageComponent } from './scenario-page.component';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';

describe('ScenarioPageComponent', () => {
  let component: ScenarioPageComponent;
  let fixture: ComponentFixture<ScenarioPageComponent>;
  let store: MockStore;

  const scenario = {
    id: 2,
    title: 'Urgent Password Reset',
    interactionType: 'Email',
    difficulty: 'Easy',
    sender: 'security@yourcompany.com',
    subject: 'Urgent Password Reset Required',
    content:
      'Please reset your password immediately using the secure link below.',
    cues: ['Urgent language', 'Suspicious link'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioPageComponent],
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

    store = TestBed.inject(MockStore);
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
    expect(component.scenario.from).toBe('security@yourcompany.com');
    expect(component.scenario.type).toBe('Email');
  });

  it('should derive scenario position from the loaded module scenario list', () => {
    expect(component.scenarioNumber).toBe(2);
    expect(component.totalScenarios).toBe(2);
  });

  it('should expose scenario cues and allow toggling selection', () => {
    expect(component.getSuspiciousCues()).toEqual([
      'Urgent language',
      'Suspicious link',
    ]);

    component.toggleCue('Urgent language');
    expect(component.selectedCues).toContain('Urgent language');

    component.toggleCue('Urgent language');
    expect(component.selectedCues).not.toContain('Urgent language');
  });
});
