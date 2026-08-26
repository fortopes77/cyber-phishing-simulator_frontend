import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should resolve a known status to its mapped variant', () => {
    component.status = 'ASSIGNED';
    expect(component.resolvedVariant).toBe('success');

    component.status = 'in progress';
    expect(component.resolvedVariant).toBe('warning');

    component.status = 'Overdue';
    expect(component.resolvedVariant).toBe('danger');
  });

  it('should fall back to neutral for an unrecognized status', () => {
    component.status = 'Something Unusual';
    expect(component.resolvedVariant).toBe('neutral');
  });

  it('should let an explicit variant override the status mapping', () => {
    component.status = 'ASSIGNED';
    component.variant = 'danger';
    expect(component.resolvedVariant).toBe('danger');
  });

  it('should render the status text and variant class', () => {
    component.status = 'ASSIGNED';
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent.trim()).toBe('ASSIGNED');
    expect(badge.classList).toContain('status-badge--success');
  });
});
