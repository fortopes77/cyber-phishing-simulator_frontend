import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ScenarioPageComponent } from './scenario-page.component';

describe('ScenarioPageComponent', () => {
  let component: ScenarioPageComponent;
  let fixture: ComponentFixture<ScenarioPageComponent>;

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load scenario from route params', () => {
    expect(component.scenarioId).toBe(2);
    expect(component.scenario.title).toContain('Urgent Password Reset');
  });

  it('should expose scenario cues and allow toggling selection', () => {
    component.scenario = {
      id: 2,
      title: 'Urgent Password Reset',
      type: 'Email',
      difficulty: 'Easy',
      from: 'security@yourcompany.com',
      subject: 'Urgent Password Reset Required',
      body: 'Please reset your password immediately using the secure link below.',
      cues: ['Urgent language', 'Suspicious link'],
    } as any;

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
