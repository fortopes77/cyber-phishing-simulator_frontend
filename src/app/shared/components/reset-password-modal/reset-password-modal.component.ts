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
import { ModalComponent } from '../modal/modal.component';
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component';
import { passwordsMatchValidator } from '../../validators/password-match.validator';
import { passwordComplexityValidator } from '../../validators/pattern.validators';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Trainer-facing "reset a learner/trainer's password" modal, opened from a
 * row action on a user list (e.g. LearnerListComponent). Unlike the
 * self-service password change embedded in ProfileModalComponent, this never
 * asks for the target's current password - the acting trainer is resetting
 * someone else's credentials, not proving they know the old one.
 */
@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormFieldErrorComponent],
  templateUrl: './reset-password-modal.component.html',
  styleUrl: './reset-password-modal.component.scss',
})
export class ResetPasswordModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() targetUserName = 'this user';
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() submitted = new EventEmitter<{ newPassword: string }>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: [
        '',
        [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), passwordComplexityValidator()],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() },
  );

  get title(): string {
    return `Reset password for ${this.targetUserName}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.form.reset({ newPassword: '', confirmPassword: '' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword } = this.form.getRawValue();
    this.submitted.emit({ newPassword });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
