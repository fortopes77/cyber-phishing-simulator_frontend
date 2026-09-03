import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { filter, map, take } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';
import { DeleteConfirmationModalComponent } from 'src/app/shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
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
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { UserAccount } from 'src/app/users/+state/user-account.model';

const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 1000;
const VERSION_MAX_LENGTH = 20;

@Component({
  selector: 'app-module-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FaIconComponent,
    FormFieldErrorComponent,
    DeleteConfirmationModalComponent,
  ],
  templateUrl: './module-edit.component.html',
  styleUrl: './module-edit.component.scss',
})
export class ModuleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly fontAwesomeIcons = iconLibrary;

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

  // The full org scenario catalog (not just this module's) - needed so the
  // "assign scenarios" search below can find and re-home any scenario, not
  // only the ones already in this module.
  allScenarios: any[] = [];
  scenarioSearch = '';
  reassigningScenarioId: string | number | null = null;
  scenarioAssignError: string | null = null;

  learners: UserAccount[] = [];
  learnerSearch = '';
  assigningLearnerIds = new Set<number>();
  addedLearnerIds = new Set<number>();
  learnerAssignError: string | null = null;

  isDeleteModalOpen = false;

  get moduleScenarios(): any[] {
    return this.allScenarios.filter(
      (scenario) => Number(scenario.moduleId) === this.moduleId,
    );
  }

  get filteredScenarios(): any[] {
    const term = this.scenarioSearch.trim().toLowerCase();
    if (!term) {
      return this.allScenarios;
    }

    return this.allScenarios.filter((scenario) =>
      String(scenario.title ?? '').toLowerCase().includes(term),
    );
  }

  get filteredLearners(): UserAccount[] {
    const term = this.learnerSearch.trim().toLowerCase();
    if (!term) {
      return this.learners;
    }

    return this.learners.filter(
      (learner) =>
        learner.fullName.toLowerCase().includes(term) ||
        learner.email.toLowerCase().includes(term) ||
        learner.username.toLowerCase().includes(term),
    );
  }

  isAssignedToThisModule(scenario: any): boolean {
    return Number(scenario.moduleId) === this.moduleId;
  }

  // UserAccount.id is a string (see user-account.model.ts's normalizeUserAccount)
  // but assignLearner/unassignLearner and the addedLearnerIds/
  // assigningLearnerIds sets are keyed by number - shared here so the
  // template's toggle-state lookups (addedLearnerIds.has(...)) use the exact
  // same coercion as the dispatch methods.
  learnerId(learner: UserAccount): number {
    return Number(learner.id);
  }

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );

    this.subscribeToModuleDetails();
    this.subscribeToLoadingAndError();
    this.subscribeToCreateSuccess();
    this.subscribeToUpdateSuccess();
    this.subscribeToScenarioAssignResult();
    this.subscribeToLearnerAssignResult();
    this.subscribeToDeleteSuccess();

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
      // Fetches every scenario in the org (not scoped to this module) so the
      // "assign scenarios" search can find and re-home any of them; scenarios
      // already in this module are derived client-side via moduleScenarios.
      this.store.dispatch(ScenarioActions.fetchList());
      this.store.select(selectScenarioList).subscribe((scenarios) => {
        this.allScenarios = scenarios ?? [];
      });
      this.store.select(selectModuleList).subscribe((moduleList) => {
        const existing = (moduleList ?? []).find(
          (module) => module.moduleId === this.moduleId,
        );
        if (existing) {
          this.patchForm(existing);
        }
      });
      this.fetchLearners();
      this.store.select(selectUserList).subscribe((users) => {
        this.learners = users ?? [];
      });
    }
  }

  // GET /users/learners is scoped to one organisation - read it off the
  // signed-in trainer's own account rather than hard-coding it.
  private fetchLearners(): void {
    this.store
      .select(selectAuthState)
      .pipe(
        map((auth) => auth?.user?.organisationId),
        filter((organisationId): organisationId is number => organisationId != null),
        take(1),
      )
      .subscribe((organisationId) => {
        this.store.dispatch(UsersActions.fetchList({ organisationId }));
      });
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

  subscribeToScenarioAssignResult(): void {
    this.actions$
      .pipe(ofType(ScenarioActions.updateScenarioSuccess))
      .subscribe(() => {
        this.reassigningScenarioId = null;
        // updateScenarioSuccess doesn't patch scenarioList in the reducer
        // (only fetchList/fetchScenariosByModule do), so re-fetch to pick up
        // the scenario's new moduleId and move it in/out of moduleScenarios.
        this.store.dispatch(ScenarioActions.fetchList());
      });

    this.actions$
      .pipe(ofType(ScenarioActions.updateScenarioFailure))
      .subscribe(({ error }) => {
        this.reassigningScenarioId = null;
        this.scenarioAssignError = error;
      });
  }

  subscribeToLearnerAssignResult(): void {
    this.actions$
      .pipe(ofType(ModulesActions.assignLearnerSuccess))
      .subscribe(({ userId }) => {
        this.assigningLearnerIds.delete(userId);
        this.addedLearnerIds.add(userId);
      });

    this.actions$
      .pipe(ofType(ModulesActions.assignLearnerFailure))
      .subscribe(({ userId, error }) => {
        this.assigningLearnerIds.delete(userId);
        this.learnerAssignError = error;
      });

    this.actions$
      .pipe(ofType(ModulesActions.unassignLearnerSuccess))
      .subscribe(({ userId }) => {
        this.assigningLearnerIds.delete(userId);
        this.addedLearnerIds.delete(userId);
      });

    this.actions$
      .pipe(ofType(ModulesActions.unassignLearnerFailure))
      .subscribe(({ userId, error }) => {
        this.assigningLearnerIds.delete(userId);
        this.learnerAssignError = error;
      });
  }

  subscribeToDeleteSuccess(): void {
    this.actions$
      .pipe(ofType(ModulesActions.deleteModuleSuccess))
      .subscribe(() => {
        this.router.navigate(['/trainer/modules']);
      });
  }

  assignScenario(scenario: any): void {
    if (!this.moduleId || this.isAssignedToThisModule(scenario)) {
      return;
    }

    this.reassigningScenarioId = scenario.id;
    this.scenarioAssignError = null;
    this.store.dispatch(
      ScenarioActions.updateScenario({
        scenarioId: String(scenario.id),
        updatedScenario: { ...scenario, moduleId: this.moduleId },
      }),
    );
  }

  // Unconfirmed against the backend whether PATCH /scenarios/{id} actually
  // accepts moduleId: null - there's no trainer account available in this
  // environment to verify live, and every prior confirmed contract only ever
  // required a real moduleId. If the backend rejects it, scenarioAssignError
  // surfaces whatever message comes back.
  unassignScenario(scenario: any): void {
    if (!this.isAssignedToThisModule(scenario)) {
      return;
    }

    this.reassigningScenarioId = scenario.id;
    this.scenarioAssignError = null;
    this.store.dispatch(
      ScenarioActions.updateScenario({
        scenarioId: String(scenario.id),
        updatedScenario: { ...scenario, moduleId: null },
      }),
    );
  }

  toggleScenario(scenario: any): void {
    if (this.isAssignedToThisModule(scenario)) {
      this.unassignScenario(scenario);
    } else {
      this.assignScenario(scenario);
    }
  }

  assignLearner(learner: UserAccount): void {
    if (!this.moduleId) {
      return;
    }

    const userId = Number(learner.id);
    this.assigningLearnerIds.add(userId);
    this.learnerAssignError = null;
    this.store.dispatch(
      ModulesActions.assignLearner({ moduleId: this.moduleId, userId }),
    );
  }

  unassignLearner(learner: UserAccount): void {
    if (!this.moduleId) {
      return;
    }

    const userId = Number(learner.id);
    this.assigningLearnerIds.add(userId);
    this.learnerAssignError = null;
    this.store.dispatch(
      ModulesActions.unassignLearner({ moduleId: this.moduleId, userId }),
    );
  }

  // Drives the toggle switch in the template - there's no GET endpoint to
  // list who's already assigned (see the ASSUMPTION note on
  // ModulesService.assignLearner), so every toggle starts off/unassigned on
  // page load regardless of the learner's real assignment state, and only
  // reflects changes made in this session.
  toggleLearner(learner: UserAccount): void {
    if (this.addedLearnerIds.has(Number(learner.id))) {
      this.unassignLearner(learner);
    } else {
      this.assignLearner(learner);
    }
  }

  handleDeleteModule(): void {
    this.isDeleteModalOpen = true;
  }

  confirmDeleteModule(): void {
    this.isDeleteModalOpen = false;
    if (!this.moduleId) {
      return;
    }

    this.store.dispatch(ModulesActions.deleteModule({ moduleId: this.moduleId }));
  }

  cancelDeleteModule(): void {
    this.isDeleteModalOpen = false;
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
