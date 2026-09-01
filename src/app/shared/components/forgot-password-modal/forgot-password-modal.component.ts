import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

/**
 * Trainer-facing "send this account a password reset email" confirmation,
 * opened from UserEditComponent. Triggers the real POST /auth/forgot-
 * password flow (the account holder gets an email with a reset link/token),
 * as opposed to the "New password" field on the same page, which lets a
 * trainer set the password directly without the account holder's involvement.
 */
@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.scss',
})
export class ForgotPasswordModalComponent {
  @Input() isOpen = false;
  @Input() targetName = 'this account';
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
