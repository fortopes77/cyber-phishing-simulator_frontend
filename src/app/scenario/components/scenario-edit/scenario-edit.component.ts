import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ScenarioActions } from '../../+state/scenario.actions';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { selectScenario } from '../../+state/scenario.selectors';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { ScenarioPageComponent } from '../scenario-page/scenario-page.component';
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  INTERACTION_TYPE_OPTIONS,
  SIMPLE_ANSWER_OPTIONS,
} from '../../models/scenario.model';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';

// The API length limits aren't published, so these mirror the ticket's
// "regex/length validation on title, description, content" note with
// generous ceilings - real enforcement (and injection protection) happens
// server-side; this is just fast feedback before a round trip.
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 1000;
const CONTENT_MAX_LENGTH = 5000;

type AnswerMode = 'simple' | 'detailed';

@Component({
  selector: 'app-scenario-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
    DashboardCardComponent,
    ScenarioPageComponent,
    FormFieldErrorComponent,
  ],
  templateUrl: './scenario-edit.component.html',
  styleUrl: './scenario-edit.component.scss',
})
export class ScenarioEditComponent implements OnInit {
  constructor(private readonly store: Store) {}
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);

  readonly scenarioForm: FormGroup = this.fb.group({
    moduleId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH)]],
    scenarioDescription: [
      '',
      [Validators.required, Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
    ],
    content: [
      '',
      [Validators.required, Validators.maxLength(CONTENT_MAX_LENGTH)],
    ],
    category: ['', Validators.required],
    difficulty: ['', Validators.required],
    interactionType: ['', Validators.required],
    // A scenario is either "simple" (a single correct answer) or "detailed"
    // (a list of correct cue phrases) - the API only accepts one or the
    // other, never both (see the ticket's create/update notes).
    answerMode: this.fb.nonNullable.control<AnswerMode>('simple'),
    correctAnswer: [''],
    correctCues: this.fb.array<FormControl<string>>([]),
  });

  modules: { moduleId: number; moduleName: string }[] = [];
  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly difficultyOptions = DIFFICULTY_OPTIONS;
  readonly interactionTypeOptions = INTERACTION_TYPE_OPTIONS;
  readonly simpleAnswerOptions = SIMPLE_ANSWER_OPTIONS;

  get correctCuesArray(): FormArray<FormControl<string>> {
    return this.scenarioForm.get('correctCues') as FormArray<
      FormControl<string>
    >;
  }

  get answerMode(): AnswerMode {
    return this.scenarioForm.get('answerMode')?.value ?? 'simple';
  }

  addCue(): void {
    this.correctCuesArray.push(this.fb.nonNullable.control(''));
  }

  removeCue(index: number): void {
    this.correctCuesArray.removeAt(index);
  }

  get previewModuleTitle(): string {
    const moduleId = Number(this.scenarioForm.get('moduleId')?.value);
    const module = this.modules.find((candidate) => candidate.moduleId === moduleId);

    return module?.moduleName || 'Scenario Preview';
  }

  // Feeds the embedded <app-scenario-page [previewMode]="true"> so the live
  // preview is rendered by the exact same component (and interaction-type
  // switch: email/text/phone/social) a learner will see - rather than a
  // hand-rolled copy of that markup that can drift out of sync with it.
  get previewScenarioData(): Record<string, any> {
    const value = this.scenarioForm.value;
    return {
      title: value.title || 'Example subject line for the scenario',
      content:
        value.content ||
        'The scenario body will display here as learners read the message.',
      interactionType: value.interactionType,
      difficulty: value.difficulty,
      moduleId: value.moduleId,
    };
  }

  scenarioId: string | null = null;
  isCreateMode = false;
  submitted = false;

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );
    this.subscribeToModuleList();
    this.store.dispatch(ModulesActions.fetchList({}));
    this.subscribeToScenarioDetails();
    this.subscribeToSaveSuccess();
    this.scenarioId = this.route.snapshot.paramMap.get('id');

    if (this.isCreateMode) {
      this.resetForm();
      return;
    }

    if (this.scenarioId) {
      this.store.dispatch(
        ScenarioActions.fetchScenarioDetails({ scenarioId: this.scenarioId }),
      );
    }
  }

  subscribeToModuleList(): void {
    this.store.select(selectModuleList).subscribe((moduleList) => {
      this.modules = (moduleList ?? []).map((module) => ({
        moduleId: module.moduleId,
        moduleName: module.moduleName,
      }));
    });
  }

  subscribeToSaveSuccess(): void {
    this.actions$
      .pipe(
        ofType(
          ScenarioActions.createScenarioSuccess,
          ScenarioActions.updateScenarioSuccess,
        ),
      )
      .subscribe(() => {
        this.router.navigate(['/trainer/scenarios']);
      });
  }

  subscribeToScenarioDetails(): void {
    this.store.select(selectScenario).subscribe((scenario) => {
      if (this.isCreateMode) {
        this.resetForm();
        return;
      }

      if (scenario) {
        const hasCues = Array.isArray(scenario.correctCues)
          && scenario.correctCues.length > 0;

        this.scenarioForm.patchValue({
          moduleId: scenario.moduleId || '',
          title: scenario.title || '',
          content: scenario.content || '',
          category: scenario.category || '',
          difficulty: scenario.difficulty || '',
          interactionType: scenario.interactionType || '',
          scenarioDescription:
            scenario.scenarioDescription || scenario.description || '',
          answerMode: hasCues ? 'detailed' : 'simple',
          correctAnswer: this.normalizeSimpleAnswer(scenario.correctAnswer),
        });

        this.correctCuesArray.clear();
        if (hasCues) {
          scenario.correctCues.forEach((cue: string) =>
            this.correctCuesArray.push(this.fb.nonNullable.control(cue)),
          );
        }
      }
    });
  }

  // The dropdown's option values are the exact-cased 'Safe'/'Suspicious'
  // strings, but a scenario saved before this dropdown existed (or with
  // inconsistent casing) may have stored 'suspicious' or 'SAFE' - match
  // case-insensitively so those still pre-select correctly instead of
  // silently falling back to the disabled placeholder option.
  private normalizeSimpleAnswer(raw: unknown): string {
    const match = this.simpleAnswerOptions.find(
      (option) => option.toLowerCase() === String(raw ?? '').toLowerCase(),
    );

    return match ?? '';
  }

  private resetForm(): void {
    this.scenarioForm.reset({
      moduleId: '',
      title: '',
      content: '',
      category: '',
      difficulty: '',
      interactionType: '',
      scenarioDescription: '',
      answerMode: 'simple',
      correctAnswer: '',
    });
    this.correctCuesArray.clear();
    this.scenarioForm.markAsPristine();
    this.scenarioForm.markAsUntouched();
    this.submitted = false;
  }

  isAnswerSectionValid(): boolean {
    if (this.answerMode === 'simple') {
      return !!this.scenarioForm.get('correctAnswer')?.value?.trim();
    }

    return this.correctCuesArray.controls.some((control) =>
      control.value?.trim(),
    );
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.scenarioForm.invalid || !this.isAnswerSectionValid()) {
      this.scenarioForm.markAllAsTouched();
      return;
    }

    const formValue = this.scenarioForm.value;
    // Only the field matching the chosen answer mode should reach the API -
    // stale values left in the other field (e.g. cues typed before
    // switching back to "simple") must not be sent alongside it.
    const scenario = {
      ...formValue,
      correctAnswer:
        formValue.answerMode === 'simple' ? formValue.correctAnswer : undefined,
      correctCues:
        formValue.answerMode === 'detailed' ? formValue.correctCues : undefined,
    };

    if (this.isCreateMode) {
      this.store.dispatch(ScenarioActions.createScenario({ scenario }));
    } else if (this.scenarioId) {
      this.store.dispatch(
        ScenarioActions.updateScenario({
          scenarioId: this.scenarioId,
          updatedScenario: scenario,
        }),
      );
    }
  }

  onCancel(): void {
    this.router.navigate(['/trainer/scenarios']);
  }
}
