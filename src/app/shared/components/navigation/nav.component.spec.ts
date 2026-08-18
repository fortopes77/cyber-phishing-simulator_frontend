import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AuthService } from '../../../auth/auth.service';
import { selectAuthState } from '../../../auth/+state/auth.selectors';

import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getFeedback']);

    await TestBed.configureTestingModule({
      imports: [NavComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideMockStore({
          selectors: [
            {
              selector: selectAuthState,
              value: {
                isAuthenticated: false,
                user: undefined,
                loading: false,
              },
            },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
