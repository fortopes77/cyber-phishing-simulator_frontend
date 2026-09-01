import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Form-level (not field-level) validator: attach to a FormGroup that has
// `newPassword` and `confirmPassword` controls, so the mismatch error can be
// shown next to the confirm field without either control reporting a false
// error on its own.
export function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  };
}
