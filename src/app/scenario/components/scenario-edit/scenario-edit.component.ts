import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ScenarioActions } from '../../+state/scenario.actions';
import { Store } from '@ngrx/store';
import { selectScenario } from '../../+state/scenario.selectors';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-scenario-edit',
  standalone: true,
  imports: [ReactiveFormsModule, HeaderComponent, DashboardCardComponent],
  templateUrl: './scenario-edit.component.html',
  styleUrl: './scenario-edit.component.scss',
})
export class ScenarioEditComponent implements OnInit {
  constructor(private readonly store: Store) {}
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly scenarioForm: FormGroup = this.fb.group({
    moduleId: ['', Validators.required],
    title: ['', Validators.required],
    content: ['', Validators.required],
    category: ['', Validators.required],
    difficulty: ['', Validators.required],
    interactionType: ['', Validators.required],
    scenarioDescription: ['', Validators.required],
  });

  readonly moduleOptions = [1, 2, 3];
  readonly categoryOptions = [
    'Phishing',
    'Social Engineering',
    'Training',
    'Credential Theft',
  ];
  readonly difficultyOptions = ['Easy', 'Medium', 'Hard'];
  readonly interactionTypeOptions = ['Email', 'SMS', 'Call'];

  get previewModuleTitle(): string {
    const moduleId = this.scenarioForm.get('moduleId')?.value;
    const moduleTitles: Record<string, string> = {
      'Module 1': 'Email Phishing Basics',
      'Module 2': 'Credentials & Social Engineering',
      'Module 3': 'Reporting Suspicious Messages',
    };

    return moduleTitles[moduleId] || 'Scenario Preview';
  }

  get previewType(): string {
    return this.scenarioForm.get('category')?.value || 'Email';
  }

  get previewDifficulty(): string {
    return this.scenarioForm.get('difficulty')?.value || 'Easy';
  }

  get previewSubject(): string {
    return (
      this.scenarioForm.get('title')?.value ||
      'Example subject line for the scenario'
    );
  }

  get previewBody(): string {
    return (
      this.scenarioForm.get('content')?.value ||
      'The scenario body will display here as learners read the message.'
    );
  }

  get previewFrom(): string {
    return 'security@company.com';
  }

  get previewScenarioNumber(): number {
    return 1;
  }

  get previewTotalScenarios(): number {
    return 1;
  }

  scenarioId: string | null = null;
  isCreateMode = false;

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );
    this.subscribeToScenarioDetails();
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

  subscribeToScenarioDetails(): void {
    this.store.select(selectScenario).subscribe((scenario) => {
      if (this.isCreateMode) {
        this.resetForm();
        return;
      }

      if (scenario) {
        this.scenarioForm.patchValue({
          moduleId: scenario.moduleId || '',
          title: scenario.title || '',
          content: scenario.content || '',
          category: scenario.category || '',
          difficulty: scenario.difficulty || '',
          interactionType: scenario.interactionType || '',
          scenarioDescription: scenario.scenarioDescription || '',
        });
      }
    });
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
    });
    this.scenarioForm.markAsPristine();
    this.scenarioForm.markAsUntouched();
  }

  onSubmit(): void {
    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      return;
    } else {
      if (this.isCreateMode) {
        this.store.dispatch(
          ScenarioActions.createScenario({
            scenario: this.scenarioForm.value,
          }),
        );
      } else {
        if (this.scenarioId) {
          this.store.dispatch(
            ScenarioActions.updateScenario({
              scenarioId: this.scenarioId,
              updatedScenario: this.scenarioForm.value,
            }),
          );
        }
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/trainer/scenarios']);
  }
}
