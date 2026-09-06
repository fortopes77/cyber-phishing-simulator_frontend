import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';
import { ForgotPasswordModalComponent } from 'src/app/shared/components/forgot-password-modal/forgot-password-modal.component';
import {
  emailValidator,
  passwordComplexityValidator,
  textValidator,
} from 'src/app/shared/validators/pattern.validators';
import { AuthActions } from 'src/app/auth/+state/auth.actions';
import { UsersActions } from '../../+state/users.actions';
import {
  selectUser,
  selectUsersError,
  selectUsersLoading,
} from '../../+state/users.selectors';
import { UpdateUserPayload, UserAccountRole } from '../../+state/user-account.model';

const NAME_MAX_LENGTH = 150;
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    DashboardCardComponent,
    FormFieldErrorComponent,
    ForgotPasswordModalComponent,
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
  ) {}

  readonly roleOptions: { value: UserAccountRole; label: string }[] = [
    { value: 'user', label: 'Learner' },
    { value: 'trainer', label: 'Trainer' },
  ];

  // `username` and `role` are only ever set at creation - the backend's
  // UpdateUserDto (PATCH /users/{id}) has no field for either, so both
  // controls are disabled once we're in edit mode (see ngOnInit).
  // `password` is required to create an account but optional to edit one
  // (blank = leave unchanged).
  readonly userForm: FormGroup = this.fb.group({
    username: [
      '',
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()],
    ],
    firstName: [
      '',
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()],
    ],
    lastName: [
      '',
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()],
    ],
    email: ['', [Validators.required, emailValidator()]],
    password: [''],
    role: this.fb.nonNullable.control<UserAccountRole>('user', Validators.required),
  });

  userId: string | null = null;
  isCreateMode = false;
  loading = false;
  error: string | null = null;

  // Which list this form returns to (and, in create mode, which role is
  // locked in) - derived from the route: /trainer/trainers(/create) manages
  // trainers, everything else (/trainer/learners...) manages learners.
  // Trainers can only be created or deleted from the Trainers screen, never
  // edited there - they're responsible for updating their own details via
  // their profile modal - so this only ever applies in create mode; there is
  // no trainers/:id/edit route.
  managingRole: UserAccountRole = 'user';

  // The account's email as loaded from the store - used for the forgot-
  // password email rather than whatever's currently typed in the (possibly
  // unsaved) email field, so a reset link is never sent to an address that
  // hasn't actually been saved yet.
  private loadedUserEmail: string | null = null;

  isForgotPasswordModalOpen = false;
  forgotPasswordSending = false;
  forgotPasswordError: string | null = null;

  ngOnInit(): void {
    const urlSegments = this.route.snapshot.url.map((segment) => segment.path);
    this.isCreateMode = urlSegments.some((path) => path.includes('create'));
    this.managingRole = urlSegments.includes('trainers') ? 'trainer' : 'user';

    this.subscribeToUserDetails();
    this.subscribeToLoadingAndError();
    this.subscribeToCreateSuccess();
    this.subscribeToUpdateSuccess();
    this.subscribeToForgotPasswordResult();

    if (this.isCreateMode) {
      this.userForm
        .get('password')
        ?.setValidators([
          Validators.required,
          Validators.minLength(MIN_PASSWORD_LENGTH),
          passwordComplexityValidator(),
        ]);

      // Creating from the Learners screen always creates a learner, and
      // creating from the Trainers screen always creates a trainer - lock
      // the role to whichever screen this is rather than leaving it an open
      // choice, so trainer creation lives solely on its own dedicated
      // screen.
      this.userForm.patchValue({ role: this.managingRole });
      this.userForm.get('role')?.disable();
      return;
    }

    // Editing: username/role can't be changed via PATCH /users/{id}, and
    // password is optional (blank = leave unchanged).
    this.userForm.get('username')?.disable();
    this.userForm.get('role')?.disable();
    this.userForm
      .get('password')
      ?.setValidators([Validators.minLength(MIN_PASSWORD_LENGTH), passwordComplexityValidator()]);

    this.userId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      this.store.dispatch(UsersActions.fetchUserDetails({ userId: this.userId }));
    }
  }

  subscribeToUserDetails(): void {
    this.store.select(selectUser).subscribe((user) => {
      if (this.isCreateMode || !user) {
        return;
      }

      this.loadedUserEmail = user.email ?? null;
      this.userForm.patchValue({
        username: user.username ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        role: user.role ?? 'user',
      });
    });
  }

  subscribeToLoadingAndError(): void {
    this.store
      .select(selectUsersLoading)
      .subscribe((loading) => (this.loading = loading));
    this.store.select(selectUsersError).subscribe((error) => (this.error = error));
  }

  subscribeToCreateSuccess(): void {
    this.actions$.pipe(ofType(UsersActions.createUserSuccess)).subscribe(() => {
      this.router.navigate([this.listRoute]);
    });
  }

  subscribeToUpdateSuccess(): void {
    this.actions$.pipe(ofType(UsersActions.updateUserSuccess)).subscribe(() => {
      this.router.navigate([this.listRoute]);
    });
  }

  private get listRoute(): string {
    return this.managingRole === 'trainer' ? '/trainer/trainers' : '/trainer/learners';
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { username, firstName, lastName, email, password, role } =
      this.userForm.getRawValue();

    if (this.isCreateMode) {
      this.store.dispatch(
        UsersActions.createUser({
          user: { username, firstName, lastName, email, password, role },
        }),
      );
      return;
    }

    if (!this.userId) {
      return;
    }

    const updatedUser: UpdateUserPayload = { firstName, lastName, email };
    if (password) {
      updatedUser.password = password;
    }

    this.store.dispatch(UsersActions.updateUser({ userId: this.userId, updatedUser }));
  }

  onCancel(): void {
    this.router.navigate([this.listRoute]);
  }

  get fullNameValue(): string {
    const { firstName, lastName } = this.userForm.getRawValue();
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  openForgotPasswordModal(): void {
    this.forgotPasswordError = null;
    this.isForgotPasswordModalOpen = true;
  }

  confirmForgotPassword(): void {
    if (!this.loadedUserEmail) {
      return;
    }

    this.forgotPasswordSending = true;
    this.store.dispatch(AuthActions.forgotPassword({ email: this.loadedUserEmail }));
  }

  cancelForgotPassword(): void {
    this.isForgotPasswordModalOpen = false;
    this.forgotPasswordError = null;
  }

  private subscribeToForgotPasswordResult(): void {
    this.actions$
      .pipe(ofType(AuthActions.forgotPasswordSuccess))
      .subscribe(() => {
        this.forgotPasswordSending = false;
        this.isForgotPasswordModalOpen = false;
      });

    this.actions$
      .pipe(ofType(AuthActions.forgotPasswordFailure))
      .subscribe(({ error }) => {
        this.forgotPasswordSending = false;
        this.forgotPasswordError = error;
      });
  }
}
