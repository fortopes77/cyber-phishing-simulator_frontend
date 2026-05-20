import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityItemComponent } from './activity-item.component';

describe('ActivityItemComponent', () => {
  let component: ActivityItemComponent;
  let fixture: ComponentFixture<ActivityItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityItemComponent);
    component = fixture.componentInstance;
    component.item = {
      userName: 'Test User',
      action: 'Completed test',
      timestamp: '1 hour ago',
      status: 'completed',
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
