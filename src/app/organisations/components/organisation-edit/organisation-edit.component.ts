import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { merge } from 'rxjs';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';
import { organisationNameValidator } from 'src/app/shared/validators/pattern.validators';
import { OrganisationsActions } from '../../+state/organisations.actions';
import {
  selectOrganisation,
  selectOrganisationsError,
  selectOrganisationsLoading,
} from '../../+state/organisations.selectors';
import { Organisation } from '../../+state/organisation.model';

// Matches CreateOrganisationDto's @MaxLength(150).
const NAME_MAX_LENGTH = 150;

@Component({
  selector: 'app-organisation-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
    DashboardCardComponent,
    FormFieldErrorComponent,
  ],
  templateUrl: './organisation-edit.component.html',
  styleUrl: './organisation-edit.component.scss',
})
export class OrganisationEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  readonly organisationForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(NAME_MAX_LENGTH),
        organisationNameValidator(),
      ],
    ],
  });

  organisationId: number | null = null;
  isCreateMode = false;
  organisation: Organisation | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );

    this.store
      .select(selectOrganisationsLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => (this.loading = loading));
    this.store
      .select(selectOrganisationsError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => (this.error = error));

    merge(
      this.actions$.pipe(ofType(OrganisationsActions.createOrganisationSuccess)),
      this.actions$.pipe(ofType(OrganisationsActions.updateOrganisationSuccess)),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.router.navigate(['/admin/organisations']));

    if (this.isCreateMode) {
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    this.organisationId = idParam ? Number(idParam) : null;
    if (!this.organisationId) {
      return;
    }

    this.store
      .select(selectOrganisation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((organisation) => {
        if (organisation?.id !== this.organisationId) {
          return;
        }
        this.organisation = organisation;
        this.organisationForm.patchValue({ name: organisation.name });
      });
    this.store.dispatch(
      OrganisationsActions.fetchDetails({ organisationId: this.organisationId }),
    );
  }

  onSubmit(): void {
    if (this.organisationForm.invalid) {
      this.organisationForm.markAllAsTouched();
      return;
    }

    const organisation = { name: this.organisationForm.getRawValue().name.trim() };

    if (this.isCreateMode) {
      this.store.dispatch(OrganisationsActions.createOrganisation({ organisation }));
    } else if (this.organisationId) {
      this.store.dispatch(
        OrganisationsActions.updateOrganisation({
          organisationId: this.organisationId,
          organisation,
        }),
      );
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/organisations']);
  }
}
