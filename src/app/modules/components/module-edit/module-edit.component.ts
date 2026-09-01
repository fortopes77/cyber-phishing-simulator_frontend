import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';
import { textValidator } from 'src/app/shared/validators/pattern.validators';
import { ModulesActions } from '../../+state/modules.actions';
import {
  selectModule,
  selectModuleList,
  selectModulesError,
  selectModulesLoading,
} from '../../+state/modules.selectors';
import { LearnerModule } from '../../+state/module.model';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';

const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 1000;
const VERSION_MAX_LENGTH = 20;

@Component({
  selector: 'app-module-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    DashboardCardComponent,
    FormFieldErrorComponent,
  ],
  templateUrl: './module-edit.component.html',
  styleUrl: './module-edit.component.scss',
})
export class ModuleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
  ) {}

  readonly moduleForm: FormGroup = this.fb.group({
    moduleName: [
      '',
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.maxLength(DESCRIPTION_MAX_LENGTH),
        textValidator(),
      ],
    ],
    version: ['', [Validators.maxLength(VERSION_MAX_LENGTH), textValidator()]],
  });

  moduleId: number | null = null;
  isCreateMode = false;
  loading = false;
  error: string | null = null;
  moduleScenarios: any[] = [];

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );

    this.subscribeToModuleDetails();
    this.subscribeToLoadingAndError();
    this.subscribeToCreateSuccess();
    this.subscribeToUpdateSuccess();

    if (this.isCreateMode) {
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    this.moduleId = idParam ? Number(idParam) : null;

    if (this.moduleId) {
      // The trainer got here from the modules list, which already dispatched
      // fetchList and holds every module (including this one) in the store -
      // populate from that immediately rather than blocking on
      // fetchModuleDetails alone, since GET training-modules/:id is an
      // unconfirmed endpoint (see the ASSUMPTION note in modules.service.ts)
      // that may 404 even though the list itself loaded fine. Re-dispatching
      // fetchList here also covers a direct/deep link to this page, where
      // the list might not have been fetched yet in this session.
      this.store.dispatch(ModulesActions.fetchList({}));
      this.store.dispatch(
        ModulesActions.fetchModuleDetails({ moduleId: this.moduleId }),
      );
      // Scenarios carry a moduleId (see scenario.service.ts createScenario
      // payload), so this scopes the read-only list below to just this
      // module's scenarios rather than the whole org catalog.
      this.store.dispatch(
        ScenarioActions.fetchScenariosByModule({ moduleId: this.moduleId }),
      );
      this.store.select(selectScenarioList).subscribe((scenarios) => {
        this.moduleScenarios = scenarios ?? [];
      });
      this.store.select(selectModuleList).subscribe((moduleList) => {
        const existing = (moduleList ?? []).find(
          (module) => module.moduleId === this.moduleId,
        );
        if (existing) {
          this.patchForm(existing);
        }
      });
    }
  }

  subscribeToModuleDetails(): void {
    this.store.select(selectModule).subscribe((module) => {
      if (this.isCreateMode || !module) {
        return;
      }

      this.patchForm(module);
    });
  }

  private patchForm(module: LearnerModule): void {
    this.moduleForm.patchValue({
      moduleName: module.moduleName ?? '',
      description: module.description ?? '',
      version: module.version ?? '',
    });
  }

  subscribeToLoadingAndError(): void {
    this.store
      .select(selectModulesLoading)
      .subscribe((loading) => (this.loading = loading));
    this.store
      .select(selectModulesError)
      .subscribe((error) => (this.error = error));
  }

  subscribeToCreateSuccess(): void {
    this.actions$
      .pipe(ofType(ModulesActions.createModuleSuccess))
      .subscribe(() => {
        this.router.navigate(['/trainer/modules']);
      });
  }

  subscribeToUpdateSuccess(): void {
    this.actions$
      .pipe(ofType(ModulesActions.updateModuleSuccess))
      .subscribe(() => {
        this.router.navigate(['/trainer/modules']);
      });
  }

  onSubmit(): void {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    const module = this.moduleForm.value;

    if (this.isCreateMode) {
      this.store.dispatch(ModulesActions.createModule({ module }));
    } else if (this.moduleId) {
      this.store.dispatch(
        ModulesActions.updateModule({
          moduleId: this.moduleId,
          updatedModule: module,
        }),
      );
    }
  }

  onCancel(): void {
    this.router.navigate(['/trainer/modules']);
  }

  manageScenarios(): void {
    this.router.navigate(['/trainer/scenarios']);
  }
}
