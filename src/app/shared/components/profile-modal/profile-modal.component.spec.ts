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

    expect(component.profileForm.value).toEqual({
      firstName: 'Ava',
      lastName: 'Morales',
      username: 'ava.morales',
      email: 'ava.morales@example.com',
    });
  });

  it('should not emit profileSubmitted when the profile form is invalid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.profileSubmitted, 'emit');

    component.profileForm.setValue({
      firstName: '',
      lastName: '',
      username: '',
      email: 'not-an-email',
    });
    component.onSubmitProfile();

    expect(component.profileSubmitted.emit).not.toHaveBeenCalled();
  });

  it('should emit profileSubmitted with the form values when valid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.profileSubmitted, 'emit');

    component.profileForm.setValue({
      firstName: 'Noah',
      lastName: 'Bennett',
      username: 'noah.bennett',
      email: 'noah.bennett@example.com',
    });
    component.onSubmitProfile();

    expect(component.profileSubmitted.emit).toHaveBeenCalledWith({
      firstName: 'Noah',
      lastName: 'Bennett',
      username: 'noah.bennett',
      email: 'noah.bennett@example.com',
    });
  });

  it('should flag a mismatch between new and confirm password', () => {
    component.passwordForm.setValue({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword2',
    });

    expect(component.passwordForm.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should emit passwordSubmitted with current and new password when valid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.passwordSubmitted, 'emit');

    component.passwordForm.setValue({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    });
    component.onSubmitPassword();

    expect(component.passwordSubmitted.emit).toHaveBeenCalledWith({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
    });
  });

  it('should reset the password form each time the modal opens', () => {
    component.passwordForm.setValue({
      currentPassword: 'stale',
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

    expect(component.passwordForm.get('currentPassword')?.value).toBe('');
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
