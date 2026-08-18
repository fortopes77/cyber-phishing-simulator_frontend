import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectAuthState,
              value: {
                isAuthenticated: true,
                loading: false,
                user: {
                  id: '1',
                  username: 'test-user',
                  email: 'test@example.com',
                  role: 'admin',
                },
              },
            },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to auth state and set currentUser', () => {
    expect(component.currentUser).toBeTruthy();
    expect(component.currentUser?.username).toBe('test-user');
  });

  it('should define viewDetails', () => {
    expect(component.viewDetails).toBeDefined();
  });
});
