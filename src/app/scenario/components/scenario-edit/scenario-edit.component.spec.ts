import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { ScenarioEditComponent } from './scenario-edit.component';
import { ScenarioActions } from '../../+state/scenario.actions';
import { selectScenario } from '../../+state/scenario.selectors';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';

describe('ScenarioEditComponent', () => {
  let component: ScenarioEditComponent;
  let fixture: ComponentFixture<ScenarioEditComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  const modules = [
    { moduleId: 1, moduleName: 'Email Phishing Basics', description: '' },
    { moduleId: 2, moduleName: 'Business Email Compromise', description: '' },
  ];

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [ScenarioEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectScenario, value: null },
            { selector: selectModuleList, value: modules },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioEditComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
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

  it('should fetch the module catalog on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(ModulesActions.fetchList({}));
  });

  it('should populate the module dropdown with real module names, not raw ids', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const options = Array.from(compiled.querySelectorAll('select option'))
      .map((option) => option.textContent?.trim());

    expect(options).toContain('Email Phishing Basics');
    expect(options).toContain('Business Email Compromise');
  });

  it('should resolve the live preview module title from the selected module id', () => {
    component.scenarioForm.patchValue({ moduleId: 2 });

    expect(component.previewModuleTitle).toBe('Business Email Compromise');
  });

  it('should fall back to a generic preview title when no module is selected yet', () => {
    expect(component.previewModuleTitle).toBe('Scenario Preview');
  });

  it('should offer only Safe/Suspicious as the simple correct-answer options', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const selects = Array.from(compiled.querySelectorAll('select'));
    const answerSelect = selects.find((select) =>
      Array.from(select.querySelectorAll('option')).some(
        (option) => option.textContent?.trim() === 'Suspicious',
      ),
    );

    expect(answerSelect).toBeTruthy();
    const optionValues = Array.from(answerSelect!.querySelectorAll('option'))
      .map((option) => option.textContent?.trim())
      .filter((text) => text !== 'Select the correct answer');

    expect(optionValues).toEqual(['Safe', 'Suspicious']);
  });

  it('should case-insensitively match a previously saved correctAnswer to the fixed dropdown options', () => {
    store.overrideSelector(selectScenario, {
      id: '1',
      moduleId: 1,
      title: 'Legacy scenario',
      correctAnswer: 'suspicious',
    });
    store.refreshState();

    expect(component.scenarioForm.get('correctAnswer')?.value).toBe(
      'Suspicious',
    );
  });

  it('should navigate back to the scenario list once the create request succeeds', () => {
    const navigateSpy = spyOn(router, 'navigate');
    actions$ = of(ScenarioActions.createScenarioSuccess({ scenario: {} }));

    fixture = TestBed.createComponent(ScenarioEditComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/trainer/scenarios']);
  });

  it('should navigate back to the scenario list once the update request succeeds', () => {
    const navigateSpy = spyOn(router, 'navigate');
    actions$ = of(ScenarioActions.updateScenarioSuccess({ scenario: {} }));

    fixture = TestBed.createComponent(ScenarioEditComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/trainer/scenarios']);
  });

  it('should show required-field validation messages and not dispatch when Save is clicked with the form empty', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Module is required.');
    expect(compiled.textContent).toContain('Title is required.');
    expect(compiled.textContent).toContain('Content is required.');
    expect(compiled.textContent).toContain('Category is required.');
    expect(compiled.textContent).toContain('Difficulty is required.');
    expect(compiled.textContent).toContain('Interaction type is required.');
    expect(compiled.textContent).toContain('Scenario description is required.');
    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ScenarioActions.createScenario.type }),
    );
  });

  it('should show a validation message for a missing simple correct answer without touching the other fields', () => {
    component.scenarioForm.patchValue({
      moduleId: 1,
      title: 'Suspicious Login Alert',
      content: 'We noticed a new sign-in to your account.',
      category: 'PHISHING',
      difficulty: 'MEDIUM',
      interactionType: 'EMAIL',
      scenarioDescription: 'Learner spots the fake login alert.',
    });
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Select the correct answer.');
    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ScenarioActions.createScenario.type }),
    );
  });

  it('should dispatch createScenario once every required field and the correct answer are filled in', () => {
    component.isCreateMode = true;
    component.scenarioForm.patchValue({
      moduleId: 1,
      title: 'Suspicious Login Alert',
      content: 'We noticed a new sign-in to your account.',
      category: 'PHISHING',
      difficulty: 'MEDIUM',
      interactionType: 'EMAIL',
      scenarioDescription: 'Learner spots the fake login alert.',
      correctAnswer: 'Suspicious',
    });
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.btn-primary')!.click();

    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: ScenarioActions.createScenario.type }),
    );
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
