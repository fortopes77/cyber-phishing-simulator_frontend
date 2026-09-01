import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

// Drop under any reactive-form input to render a consistent validation
// message for it - understands Validators.required/email/minLength/
// maxLength/min/max/pattern plus the custom `number`/`text` error keys
// from shared/validators/pattern.validators.ts, so every form (string,
// number, or email input) reports errors the same way instead of each
// component writing its own *ngIf error block.
@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field-error.component.html',
  styleUrl: './form-field-error.component.scss',
})
export class FormFieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() label = 'This field';

  get message(): string | null {
    const control = this.control;
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return null;
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.label} is required.`;
    }
    if (errors['email']) {
      return 'Enter a valid email address.';
    }
    if (errors['number']) {
      return `${this.label} must be a number.`;
    }
    if (errors['text']) {
      return `${this.label} contains characters that aren't allowed.`;
    }
    if (errors['passwordComplexity']) {
      return `${this.label} must include at least 1 number and 1 special character (!@#$%*?).`;
    }
    if (errors['minlength']) {
      return `${this.label} must be at least ${errors['minlength'].requiredLength} characters.`;
    }
    if (errors['maxlength']) {
      return `${this.label} must be ${errors['maxlength'].requiredLength} characters or fewer.`;
    }
    if (errors['min']) {
      return `${this.label} must be at least ${errors['min'].min}.`;
    }
    if (errors['max']) {
      return `${this.label} must be ${errors['max'].max} or less.`;
    }
    if (errors['pattern']) {
      return `${this.label} is not in a valid format.`;
    }

    return `${this.label} is invalid.`;
  }
}
