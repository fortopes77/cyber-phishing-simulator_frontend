import { FormControl } from '@angular/forms';
import {
  emailValidator,
  numberValidator,
  textValidator,
} from './pattern.validators';

describe('pattern.validators', () => {
  describe('emailValidator', () => {
    const control = new FormControl('', emailValidator());

    it('should pass a valid email', () => {
      control.setValue('jane.doe@example.com');
      expect(control.errors).toBeNull();
    });

    it('should fail an invalid email', () => {
      control.setValue('not-an-email');
      expect(control.errors).toEqual({ email: true });
    });

    it('should not flag an empty value (leave that to Validators.required)', () => {
      control.setValue('');
      expect(control.errors).toBeNull();
    });
  });

  describe('numberValidator', () => {
    const control = new FormControl('', numberValidator());

    it('should pass an integer and a decimal', () => {
      control.setValue('42');
      expect(control.errors).toBeNull();

      control.setValue('-3.5');
      expect(control.errors).toBeNull();
    });

    it('should fail a non-numeric value', () => {
      control.setValue('abc');
      expect(control.errors).toEqual({ number: true });
    });
  });

  describe('textValidator', () => {
    const control = new FormControl('', textValidator());

    it('should pass normal free text', () => {
      control.setValue("Urgent: Reset your password (24hrs) - it's fine.");
      expect(control.errors).toBeNull();
    });

    it('should fail text containing disallowed characters', () => {
      control.setValue('<script>alert(1)</script>');
      expect(control.errors).toEqual({ text: true });
    });
  });
});
