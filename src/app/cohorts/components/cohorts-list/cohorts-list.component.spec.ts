import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CohortsListComponent } from './cohorts-list.component';

describe('CohortsListComponent', () => {
  let component: CohortsListComponent;
  let fixture: ComponentFixture<CohortsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CohortsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CohortsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
