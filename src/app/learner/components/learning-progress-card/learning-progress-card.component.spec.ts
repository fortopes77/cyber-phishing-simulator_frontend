import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { LearningProgressCardComponent } from './learning-progress-card.component';

describe('LearningProgressCardComponent', () => {
  let component: LearningProgressCardComponent;
  let fixture: ComponentFixture<LearningProgressCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningProgressCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningProgressCardComponent);
    component = fixture.componentInstance;
    component.item = {
      id: '1',
      title: 'Test Progress',
      completedScenarios: 1,
      totalScenarios: 2,
      progressPercentage: 50,
      route: '/test',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
