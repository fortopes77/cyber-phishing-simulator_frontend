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
import { emailValidator, textValidator } from '../../validators/pattern.validators';
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
    username: string;
    email: string;
  }>();
  @Output() passwordSubmitted = new EventEmitter<{
    currentPassword: string;
    newPassword: string;
  }>();

  private readonly fb = inject(FormBuilder);

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()]],
    lastName: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()]],
    username: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH), textValidator()]],
    email: ['', [Validators.required, emailValidator()]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
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
      this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSubmitted.emit(this.profileForm.getRawValue());
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordSubmitted.emit({ currentPassword, newPassword });
  }

  onClose(): void {
    this.closed.emit();
  }
}
