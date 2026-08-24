import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SignOutConfirmationModalComponent } from './sign-out-confirmation-modal.component';

describe('SignOutConfirmationModalComponent', () => {
  let component: SignOutConfirmationModalComponent;
  let fixture: ComponentFixture<SignOutConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignOutConfirmationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignOutConfirmationModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirmed when the sign out button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.confirmed, 'emit');

    fixture.debugElement.query(By.css('.btn-danger')).nativeElement.click();

    expect(component.confirmed.emit).toHaveBeenCalled();
  });

  it('should emit cancelled when the cancel button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.cancelled, 'emit');

    fixture.debugElement.query(By.css('.btn-secondary')).nativeElement.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should emit cancelled when the modal is closed via the backdrop', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.cancelled, 'emit');

    fixture.debugElement.query(By.css('.modal-backdrop')).nativeElement.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
