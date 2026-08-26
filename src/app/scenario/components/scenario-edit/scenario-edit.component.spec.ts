import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { ScenarioEditComponent } from './scenario-edit.component';
import { selectScenario } from '../../+state/scenario.selectors';

describe('ScenarioEditComponent', () => {
  let component: ScenarioEditComponent;
  let fixture: ComponentFixture<ScenarioEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectScenario, value: null }],
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the edit form controls and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Module');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should read the scenario id from the route', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('42');

    fixture = TestBed.createComponent(ScenarioEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.scenarioId).toBe('42');
  });

  it('should render the live preview via the shared scenario-page component', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-scenario-page')).toBeTruthy();
  });

  it('should feed the form values into the preview data', () => {
    component.scenarioForm.patchValue({
      title: 'Suspicious Login Alert',
      content: 'We noticed a new sign-in to your account.',
      interactionType: 'EMAIL',
    });

    expect(component.previewScenarioData['title']).toBe(
      'Suspicious Login Alert',
    );
    expect(component.previewScenarioData['content']).toBe(
      'We noticed a new sign-in to your account.',
    );
  });

  it('should switch the preview message shell as the interaction type changes', () => {
    component.scenarioForm.patchValue({
      title: 'Deal drop',
      content: 'Alex: Check this out\nYou: What is it?',
      interactionType: 'SOCIAL_MEDIA',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.social-bubble').length).toBe(2);
  });
});
