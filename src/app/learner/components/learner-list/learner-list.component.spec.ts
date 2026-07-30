import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnerListComponent } from './learner-list.component';

describe('LearnerListComponent', () => {
  let component: LearnerListComponent;
  let fixture: ComponentFixture<LearnerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearnerListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LearnerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed the learner list with learner data', () => {
    expect(component.rows.length).toBeGreaterThan(0);
    expect(component.columns.length).toBeGreaterThan(0);
    expect(
      component.columns.some((column) => column.key === 'email'),
    ).toBeTrue();
  });

  it('should expose a richer action set for learner management', () => {
    expect(component.actions.length).toBeGreaterThan(3);
    expect(
      component.actions.some((action) => action.label === 'Deactivate'),
    ).toBeTrue();
  });
});
