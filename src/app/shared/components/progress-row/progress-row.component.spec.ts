import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressRowComponent } from './progress-row.component';

describe('ProgressRowComponent', () => {
  let component: ProgressRowComponent;
  let fixture: ComponentFixture<ProgressRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
