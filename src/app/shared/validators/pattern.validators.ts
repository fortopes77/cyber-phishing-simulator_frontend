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
