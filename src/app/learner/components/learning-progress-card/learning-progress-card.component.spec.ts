import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningProgressCardComponent } from './learning-progress-card.component';

describe('LearningProgressCardComponent', () => {
  let component: LearningProgressCardComponent;
  let fixture: ComponentFixture<LearningProgressCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningProgressCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningProgressCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
