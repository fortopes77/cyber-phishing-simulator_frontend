import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { FormFieldErrorComponent } from 'src/app/shared/components/form-field-error/form-field-error.component';
import { SendReminderModalComponent } from 'src/app/shared/components/send-reminder-modal/send-reminder-modal.component';
import {
  emailValidator,
  passwordComplexityValidator,
  textValidator,
} from 'src/app/shared/validators/pattern.validators';
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
    SendReminderModalComponent,
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

  // Tracks the role the account was loaded with, not the (possibly
  // unsaved) value of the role dropdown - so the "Send Reminder Email"
  // button doesn't appear/disappear as a trainer edits the role field
  // before saving.
  isLearner = false;

  isSendReminderModalOpen = false;
  reminderSending = false;
  reminderError: string | null = null;

  ngOnInit(): void {
    this.isCreateMode = this.route.snapshot.url.some((segment) =>
      segment.path.includes('create'),
    );

    this.subscribeToUserDetails();
    this.subscribeToLoadingAndError();
    this.subscribeToCreateSuccess();
    this.subscribeToUpdateSuccess();
    this.subscribeToReminderEmailResult();

    if (this.isCreateMode) {
      this.userForm
        .get('password')
        ?.setValidators([
          Validators.required,
          Validators.minLength(MIN_PASSWORD_LENGTH),
          passwordComplexityValidator(),
        ]);
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

      this.isLearner = user.role === 'user';
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
      this.router.navigate(['/trainer/learners']);
    });
  }

  subscribeToUpdateSuccess(): void {
    this.actions$.pipe(ofType(UsersActions.updateUserSuccess)).subscribe(() => {
      this.router.navigate(['/trainer/learners']);
    });
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
    this.router.navigate(['/trainer/learners']);
  }

  get fullNameValue(): string {
    const { firstName, lastName } = this.userForm.getRawValue();
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  openSendReminderModal(): void {
    this.reminderError = null;
    this.isSendReminderModalOpen = true;
  }

  confirmSendReminder(): void {
    if (!this.userId) {
      return;
    }

    this.reminderSending = true;
    this.store.dispatch(UsersActions.sendReminderEmail({ userId: this.userId }));
  }

  cancelSendReminder(): void {
    this.isSendReminderModalOpen = false;
    this.reminderError = null;
  }

  private subscribeToReminderEmailResult(): void {
    this.actions$
      .pipe(ofType(UsersActions.sendReminderEmailSuccess))
      .subscribe(() => {
        this.reminderSending = false;
        this.isSendReminderModalOpen = false;
      });

    this.actions$
      .pipe(ofType(UsersActions.sendReminderEmailFailure))
      .subscribe(({ error }) => {
        this.reminderSending = false;
        this.reminderError = error;
      });
  }
}
