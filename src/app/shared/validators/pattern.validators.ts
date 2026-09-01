import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

// Standard regexes reused across reactive forms so every input validates
// email/number/text values the same way instead of each form re-inventing
// its own pattern.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
// Free-text fields (titles, descriptions, names): letters, numbers, spaces
// and common punctuation - blocks stray control/markup characters without
// being so strict it rejects normal scenario copy.
export const TEXT_PATTERN = /^[\w\s.,'"!?()&/@:;-]*$/;
// Mirrors the backend's password-complexity rule (class-validator, on
// RegisterUserDto/CreateUserDto/UpdateUserDto's password field): at least
// one digit and one of !@#$%*? - checked here too so a bad password is
// rejected client-side instead of round-tripping to a 400.
export const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*\d)(?=.*[!@#$%*?]).+$/;

function patternValidator(pattern: RegExp, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return pattern.test(String(value)) ? null : { [errorKey]: true };
  };
}

export function emailValidator(): ValidatorFn {
  return patternValidator(EMAIL_PATTERN, 'email');
}

export function numberValidator(): ValidatorFn {
  return patternValidator(NUMBER_PATTERN, 'number');
}

export function textValidator(): ValidatorFn {
  return patternValidator(TEXT_PATTERN, 'text');
}

export function passwordComplexityValidator(): ValidatorFn {
  return patternValidator(PASSWORD_COMPLEXITY_PATTERN, 'passwordComplexity');
}
