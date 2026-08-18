import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ScenarioChoiceComponent } from './scenario-choice.component';

describe('ScenarioChoiceComponent', () => {
  let component: ScenarioChoiceComponent;
  let fixture: ComponentFixture<ScenarioChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioChoiceComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '2' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the correct scenario from route params', () => {
    expect(component.scenarioNumber).toBe(2);
    expect(component.scenario.title).toContain('IT Department Software Update');
  });

  it('should navigate to results when decision is made on the final scenario', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.scenarioNumber = 2;
    component.selectDecision('suspicious');

    expect(router.navigate).toHaveBeenCalledWith(['/learner/results']);
  });

  it('should navigate to the next scenario when decision is made before the last scenario', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.scenarioNumber = 1;
    component.totalScenarios = 2;
    component.selectDecision('safe');

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });
});
