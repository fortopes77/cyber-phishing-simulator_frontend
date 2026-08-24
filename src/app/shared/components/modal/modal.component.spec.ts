import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the backdrop when closed', () => {
    component.isOpen = false;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.modal-backdrop'))).toBeNull();
  });

  it('should render when open', () => {
    component.isOpen = true;
    component.title = 'My modal';
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.modal-backdrop'))).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('.modal-header h3')).nativeElement
        .textContent,
    ).toContain('My modal');
  });

  it('should emit closed when the backdrop is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.closed, 'emit');

    fixture.debugElement.query(By.css('.modal-backdrop')).nativeElement.click();

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should not emit closed when the card itself is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.closed, 'emit');

    fixture.debugElement.query(By.css('.modal-card')).nativeElement.click();

    expect(component.closed.emit).not.toHaveBeenCalled();
  });

  it('should emit closed when the close button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    spyOn(component.closed, 'emit');

    fixture.debugElement.query(By.css('.modal-close')).nativeElement.click();

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit closed on Escape only while open', () => {
    spyOn(component.closed, 'emit');

    component.isOpen = false;
    component.onEscape();
    expect(component.closed.emit).not.toHaveBeenCalled();

    component.isOpen = true;
    component.onEscape();
    expect(component.closed.emit).toHaveBeenCalled();
  });
});
