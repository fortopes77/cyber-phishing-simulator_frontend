import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DateRangePickerComponent } from './date-range-picker.component';

describe('DateRangePickerComponent', () => {
  let component: DateRangePickerComponent;
  let fixture: ComponentFixture<DateRangePickerComponent>;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangePickerComponent, NoopAnimationsModule],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerElement = overlayContainer.getContainerElement();

    fixture = TestBed.createComponent(DateRangePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the label as the trigger text when no range is selected', () => {
    component.label = 'Last Active';
    fixture.detectChanges();

    expect(component.triggerLabel).toBe('Last Active');
    expect(component.hasSelection).toBeFalse();
  });

  it('should show a formatted range as the trigger text once dates are set', () => {
    component.startDate = new Date(2026, 0, 1);
    component.endDate = new Date(2026, 0, 15);
    component.ngOnChanges({
      startDate: { currentValue: component.startDate, previousValue: null, firstChange: true, isFirstChange: () => true },
    });
    fixture.detectChanges();

    expect(component.hasSelection).toBeTrue();
    expect(component.triggerLabel).toContain('Jan 1');
    expect(component.triggerLabel).toContain('Jan 15');
  });

  it('should open the panel in the CDK overlay when the trigger is clicked', () => {
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLElement;

    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen).toBeTrue();
    expect(overlayContainerElement.querySelector('.date-range-panel')).toBeTruthy();
  });

  it('should close the panel when the trigger is clicked again', () => {
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLElement;

    trigger.click();
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen).toBeFalse();
    expect(overlayContainerElement.querySelector('.date-range-panel')).toBeFalsy();
  });

  it('should emit the preset range and close on applyPreset', () => {
    spyOn(component.rangeChange, 'emit');
    const preset = {
      label: 'Last 7 days',
      getRange: () => ({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 7) }),
    };

    component.applyPreset(preset);

    expect(component.rangeChange.emit).toHaveBeenCalledWith({
      start: new Date(2026, 0, 1),
      end: new Date(2026, 0, 7),
    });
    expect(component.isOpen).toBeFalse();
  });

  it('should emit the draft dates parsed as local dates on applyDraft', () => {
    spyOn(component.rangeChange, 'emit');
    component.draftStart = '2026-02-01';
    component.draftEnd = '2026-02-10';

    component.applyDraft();

    expect(component.rangeChange.emit).toHaveBeenCalledWith({
      start: new Date(2026, 1, 1),
      end: new Date(2026, 1, 10),
    });
  });

  it('should emit a null range and reset drafts on clear', () => {
    spyOn(component.rangeChange, 'emit');
    component.draftStart = '2026-02-01';
    component.draftEnd = '2026-02-10';

    component.clear();

    expect(component.rangeChange.emit).toHaveBeenCalledWith({ start: null, end: null });
    expect(component.draftStart).toBe('');
    expect(component.draftEnd).toBe('');
  });

  it('should dispose the overlay on destroy', () => {
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    fixture.destroy();

    expect(overlayContainerElement.querySelector('.date-range-panel')).toBeFalsy();
  });
});
