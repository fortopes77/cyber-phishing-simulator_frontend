import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCardComponent } from './data-card.component';

describe('DataCardComponent', () => {
  let component: DataCardComponent;
  let fixture: ComponentFixture<DataCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a zero singleValue instead of hiding it', () => {
    // This is an OnPush component, so a plain property assignment doesn't
    // mark it dirty - setInput() simulates a real bound @Input change,
    // same as fixture.detectChanges() would pick up from a parent template.
    fixture.componentRef.setInput('statistic', { singleValue: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.statistic').textContent.trim()).toBe('0');
  });

  it('should render a zero percentage instead of hiding it', () => {
    fixture.componentRef.setInput('statistic', { percentage: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.statistic').textContent.trim()).toBe('0%');
  });

  it('should render a zero topValue/bottomValue pair instead of hiding it', () => {
    fixture.componentRef.setInput('statistic', { topValue: 0, bottomValue: 5 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.statistic').textContent.trim()).toBe('0/5');
  });

  it('should render nothing when no statistic is provided', () => {
    fixture.componentRef.setInput('statistic', undefined);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.statistic').textContent.trim()).toBe('');
  });
});
