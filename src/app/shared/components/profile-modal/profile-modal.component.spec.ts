import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProfileModalComponent } from './profile-modal.component';
import { User } from 'src/app/auth/auth.service';

describe('ProfileModalComponent', () => {
  let component: ProfileModalComponent;
  let fixture: ComponentFixture<ProfileModalComponent>;

  const user: User = {
    id: '1',
    firstName: 'Ava',
    lastName: 'Morales',
    username: 'ava.morales',
    email: 'ava.morales@example.com',
    role: 'user',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch the profile form from the user input', () => {
    component.user = user;
    component.ngOnChanges({
      user: {
        currentValue: user,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.profileForm.getRawValue()).toEqual({
      firstName: 'Ava',
      lastName: 'Morales',
      username: 'ava.morales',
      email: 'ava.morales@example.com',
    });
  });

  it('should keep the username control disabled so it can never be submitted', () => {
    expect(component.profileForm.get('username')?.disabled).toBeTrue();
  });

  it('should not emit profileSubmitted when the profile form is invalid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.profileSubmitted, 'emit');

    component.profileForm.patchValue({
      firstName: '',
      lastName: '',
      email: 'not-an-email',
    });
    component.onSubmitProfile();

    expect(component.profileSubmitted.emit).not.toHaveBeenCalled();
  });

  it('should emit profileSubmitted with the form values when valid, excluding username', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.profileSubmitted, 'emit');

    component.profileForm.patchValue({
      firstName: 'Noah',
      lastName: 'Bennett',
      email: 'noah.bennett@example.com',
    });
    component.onSubmitProfile();

    expect(component.profileSubmitted.emit).toHaveBeenCalledWith({
      firstName: 'Noah',
      lastName: 'Bennett',
      email: 'noah.bennett@example.com',
    });
  });

  it('should flag a mismatch between new and confirm password', () => {
    component.passwordForm.setValue({
      newPassword: 'newpassword1!',
      confirmPassword: 'newpassword2!',
    });

    expect(component.passwordForm.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should reject a new password missing the required number/special character', () => {
    component.passwordForm.setValue({
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    });

    expect(
      component.passwordForm.get('newPassword')?.errors?.['passwordComplexity'],
    ).toBeTrue();
  });

  it('should emit passwordSubmitted with just the new password when valid (no currentPassword field - the backend has no route to verify one)', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.passwordSubmitted, 'emit');

    component.passwordForm.setValue({
      newPassword: 'newpassword1!',
      confirmPassword: 'newpassword1!',
    });
    component.onSubmitPassword();

    expect(component.passwordSubmitted.emit).toHaveBeenCalledWith({
      newPassword: 'newpassword1!',
    });
  });

  it('should reset the password form each time the modal opens', () => {
    component.passwordForm.setValue({
      newPassword: 'stale',
      confirmPassword: 'stale',
    });

    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.passwordForm.get('newPassword')?.value).toBe('');
  });

  it('should emit closed when the modal close button is clicked', () => {
    component.isOpen = true;
    component.user = user;
    fixture.detectChanges();
    spyOn(component.closed, 'emit');

    fixture.debugElement.query(By.css('.modal-close')).nativeElement.click();

    expect(component.closed.emit).toHaveBeenCalled();
  });
});
