import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FormFieldErrorComponent } from './form-field-error.component';
import { emailValidator, numberValidator } from '../../validators/pattern.validators';

describe('FormFieldErrorComponent', () => {
  let component: FormFieldErrorComponent;
  let fixture: ComponentFixture<FormFieldErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldErrorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show nothing when the control is untouched, even if invalid', () => {
    component.control = new FormControl('', Validators.required);
    fixture.detectChanges();

    expect(component.message).toBeNull();
    expect(fixture.nativeElement.querySelector('.form-field-error')).toBeNull();
  });

  it('should show a required message once the control is touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;
    component.label = 'Title';
    fixture.detectChanges();

    expect(component.message).toBe('Title is required.');
  });

  it('should show an email-specific message', () => {
    const control = new FormControl('not-an-email', emailValidator());
    control.markAsTouched();
    component.control = control;

    expect(component.message).toBe('Enter a valid email address.');
  });

  it('should show a number-specific message using the field label', () => {
    const control = new FormControl('abc', numberValidator());
    control.markAsTouched();
    component.control = control;
    component.label = 'Amount';

    expect(component.message).toBe('Amount must be a number.');
  });

  it('should show a maxlength message with the required length', () => {
    const control = new FormControl('too long', Validators.maxLength(3));
    control.markAsTouched();
    component.control = control;
    component.label = 'Code';

    expect(component.message).toBe('Code must be 3 characters or fewer.');
  });

  it('should clear the message once the control becomes valid', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();
    expect(component.message).not.toBeNull();

    control.setValue('a value');
    fixture.detectChanges();
    expect(component.message).toBeNull();
  });
});
