
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ScenarioActions } from '../+state/scenario.actions';
import { Store } from '@ngrx/store';
import { selectScenario } from '../+state/scenario.selectors';

@Component({
  selector: 'app-scenario-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
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
    description: ['', Validators.required],
  });

  readonly moduleOptions = ['Module 1', 'Module 2', 'Module 3'];
  readonly categoryOptions = ['Phishing', 'Social Engineering', 'Training'];
  readonly difficultyOptions = ['Easy', 'Medium', 'Hard'];
  readonly interactionTypeOptions = [
    'Multiple Choice',
    'Text Input',
    'Drag and Drop',
  ];
  scenarioId: string | null = null;
  isCreateMode = false;

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );
    this.subscribeToScenarioDetails();
    this.scenarioId = this.route.snapshot.paramMap.get('id');

    if (this.scenarioId) {
      this.store.dispatch(
        ScenarioActions.fetchScenarioDetails({ scenarioId: this.scenarioId }),
      );
    }
  }

  subscribeToScenarioDetails(): void {
    this.store.select(selectScenario).subscribe((scenario) => {
      if (scenario) {
        this.scenarioForm.patchValue({
          moduleId: scenario.moduleId || '',
          title: scenario.title || '',
          content: scenario.content || '',
          category: scenario.category || '',
          difficulty: scenario.difficulty || '',
          interactionType: scenario.interactionType || '',
          description: scenario.scenarioDescription || '',
        });
      }
    });
  }

  onSubmit(): void {
    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      return;
    }
  }

  onCancel(): void {
    this.router.navigate(['/trainer/scenarios']);
  }
}
