import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SendReminderModalComponent } from './send-reminder-modal.component';

describe('SendReminderModalComponent', () => {
  let component: SendReminderModalComponent;
  let fixture: ComponentFixture<SendReminderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendReminderModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SendReminderModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the learner name in the confirmation message', () => {
    component.isOpen = true;
    component.learnerName = 'Ava Morales';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ava Morales');
  });

  it('should emit confirmed when the send button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.confirmed, 'emit');

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(component.confirmed.emit).toHaveBeenCalled();
  });

  it('should emit cancelled when the cancel button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.cancelled, 'emit');

    fixture.debugElement.query(By.css('.btn-secondary')).nativeElement.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should disable the send button while loading', () => {
    component.isOpen = true;
    component.loading = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.btn-primary'))
      .nativeElement as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });
});
