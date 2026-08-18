import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { iconLibrary } from '../../constants/font-awesome-icons.const';

import { ActionCardComponent } from './action-card.component';

describe('ActionCardComponent', () => {
  let component: ActionCardComponent;
  let fixture: ComponentFixture<ActionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionCardComponent);
    component = fixture.componentInstance;
    component.icon = iconLibrary.userGroupIcon;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
