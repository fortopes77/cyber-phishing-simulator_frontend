import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ResetPasswordModalComponent } from './reset-password-modal.component';

describe('ResetPasswordModalComponent', () => {
  let component: ResetPasswordModalComponent;
  let fixture: ComponentFixture<ResetPasswordModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should title the modal with the target user name', () => {
    component.targetUserName = 'Ava Morales';
    expect(component.title).toBe('Reset password for Ava Morales');
  });

  it('should not emit submitted when the form is invalid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.submitted, 'emit');

    component.onSubmit();

    expect(component.submitted.emit).not.toHaveBeenCalled();
    expect(component.form.get('newPassword')?.touched).toBeTrue();
  });

  it('should flag a mismatch between new and confirm password', () => {
    component.form.setValue({ newPassword: 'password1', confirmPassword: 'password2' });
    expect(component.form.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should emit submitted with the new password when valid', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.submitted, 'emit');
    component.form.setValue({ newPassword: 'longenough1', confirmPassword: 'longenough1' });

    component.onSubmit();

    expect(component.submitted.emit).toHaveBeenCalledWith({ newPassword: 'longenough1' });
  });

  it('should emit cancelled when the cancel button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.cancelled, 'emit');

    fixture.debugElement.query(By.css('.btn-secondary')).nativeElement.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should reset the form each time the modal opens', () => {
    component.form.setValue({ newPassword: 'stale-value', confirmPassword: 'stale-value' });

    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.form.get('newPassword')?.value).toBe('');
  });
});
