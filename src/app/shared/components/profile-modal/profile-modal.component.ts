import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from 'src/app/auth/auth.service';
import { ModalComponent } from '../modal/modal.component';
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component';
import {
  emailValidator,
  passwordComplexityValidator,
  textValidator,
} from '../../validators/pattern.validators';
import { passwordsMatchValidator } from '../../validators/password-match.validator';

const NAME_MAX_LENGTH = 150;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Opened from the nav's account card (bottom left). Bundles the signed-in
 * user's own profile details and password change into one modal with two
 * independently-submittable sections, rather than two separate modals -
 * profile details and password are unrelated concerns to the backend (two
 * different endpoints/actions) but a single "manage my account" entry point
 * to the user.
 */
@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormFieldErrorComponent],
  templateUrl: './profile-modal.component.html',
  styleUrl: './profile-modal.component.scss',
})
export class ProfileModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;

  @Input() profileSaving = false;
  @Input() profileError: string | null = null;
  @Input() profileSaved = false;

  @Input() passwordSaving = false;
  @Input() passwordError: string | null = null;
  @Input() passwordSaved = false;

  @Output() closed = new EventEmitter<void>();
  @Output() profileSubmitted = new EventEmitter<{
    firstName: string;
    lastName: string;
    email: string;
  }>();
  // No `currentPassword`: this backend has no route to verify it before
  // changing a password (PATCH /users/{id} - the only self-service password
  // change endpoint - rejects any field UpdateUserDto doesn't declare).
  @Output() passwordSubmitted = new EventEmitter<{ newPassword: string }>();

  private readonly fb = inject(FormBuilder);

  // `username` is display-only: the backend's PATCH /users/{id} has no field
  // for it, so it's shown for reference but disabled and never part of the
  // profileSubmitted payload.
  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()]],
    lastName: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()]],
    username: [{ value: '', disabled: true }],
    email: ['', [Validators.required, emailValidator()]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: [
        '',
        [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), passwordComplexityValidator()],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() },
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName ?? '',
        lastName: this.user.lastName ?? '',
        username: this.user.username ?? '',
        email: this.user.email ?? '',
      });
    }

    if (changes['isOpen'] && this.isOpen) {
      this.passwordForm.reset({ newPassword: '', confirmPassword: '' });
    }
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email } = this.profileForm.getRawValue();
    this.profileSubmitted.emit({ firstName, lastName, email });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword } = this.passwordForm.getRawValue();
    this.passwordSubmitted.emit({ newPassword });
  }

  onClose(): void {
    this.closed.emit();
  }
}
