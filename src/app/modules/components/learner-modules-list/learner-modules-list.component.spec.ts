import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnerModulesListComponent } from './learner-modules-list.component';

describe('LearnerModulesListComponent', () => {
  let component: LearnerModulesListComponent;
  let fixture: ComponentFixture<LearnerModulesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearnerModulesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearnerModulesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
