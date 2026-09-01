import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SelectModuleModalComponent } from './select-module-modal.component';

describe('SelectModuleModalComponent', () => {
  let component: SelectModuleModalComponent;
  let fixture: ComponentFixture<SelectModuleModalComponent>;

  const modules = [
    { moduleId: 1, moduleName: 'Email Phishing Basics' },
    { moduleId: 2, moduleName: 'Business Email Compromise' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectModuleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectModuleModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the selection to the first module when opened', () => {
    fixture.componentRef.setInput('modules', modules);
    fixture.componentRef.setInput('isOpen', true);
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.selectedModuleId).toBe(1);
  });

  it('should show the empty state and disable confirm when there are no modules', () => {
    fixture.componentRef.setInput('modules', []);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No modules available');
    const button = fixture.debugElement.query(By.css('.btn-primary'))
      .nativeElement as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('should emit confirmed with the selected module id', () => {
    spyOn(component.confirmed, 'emit');
    fixture.componentRef.setInput('modules', modules);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    // Simulates the user picking the second module - setting selectedModuleId
    // before the modal opens would just get overwritten by ngOnChanges'
    // "default to the first module" behavior.
    component.selectedModuleId = 2;

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(component.confirmed.emit).toHaveBeenCalledWith(2);
  });

  it('should emit cancelled when the cancel button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    spyOn(component.cancelled, 'emit');

    fixture.debugElement.query(By.css('.btn-secondary')).nativeElement.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should disable the confirm button while loading', () => {
    fixture.componentRef.setInput('modules', modules);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.btn-primary'))
      .nativeElement as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });
});
