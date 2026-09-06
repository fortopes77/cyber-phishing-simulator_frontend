import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  function open(): void {
    component.modules = modules;
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the first module and simple answer mode when opened', () => {
    open();

    expect(component.selectedModuleId).toBe(1);
    expect(component.answerMode).toBe('simple');
  });

  it('should reset to simple answer mode every time it is reopened, even if detailed was picked last time', () => {
    open();
    component.answerMode = 'detailed';

    open();

    expect(component.answerMode).toBe('simple');
  });

  it('should emit the selected module and simple answer mode on confirm', () => {
    open();
    const confirmedSpy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(confirmedSpy);

    component.onConfirm();

    expect(confirmedSpy).toHaveBeenCalledWith({ moduleId: 1, answerMode: 'simple' });
  });

  it('should emit the detailed answer mode when it is selected before confirming', () => {
    open();
    component.answerMode = 'detailed';
    const confirmedSpy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(confirmedSpy);

    component.onConfirm();

    expect(confirmedSpy).toHaveBeenCalledWith({ moduleId: 1, answerMode: 'detailed' });
  });

  it('should not emit when no module is selected', () => {
    const confirmedSpy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(confirmedSpy);

    component.onConfirm();

    expect(confirmedSpy).not.toHaveBeenCalled();
  });

  it('should emit cancelled on cancel', () => {
    const cancelledSpy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(cancelledSpy);

    component.onCancel();

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should render the answer-mode radio options once modules are available', () => {
    open();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Simple (Safe / Suspicious)');
    expect(text).toContain('Detailed (correct cue phrases)');
  });
});
