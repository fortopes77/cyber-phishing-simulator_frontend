/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../auth.service';
import { AuthActions } from '../../+state/auth.actions';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAuthState } from '../../+state/auth.selectors';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'getCurrentUser',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when credential is empty', () => {
    component.credential = '';
    component.password = 'password';
    component.onLogin();
    expect(component.errorMessage).toBe(
      'Please enter both username/email and password',
    );
  });

  it('should show error when password is empty', () => {
    component.credential = 'admin';
    component.password = '';
    component.onLogin();
    expect(component.errorMessage).toBe(
      'Please enter both username/email and password',
    );
  });

  it('should dispatch login action on valid credentials', () => {
    component.credential = 'admin@example.com';
    component.password = 'admin';

    component.onLogin();

    expect(dispatchSpy).toHaveBeenCalledWith(
      AuthActions.login({
        credential: 'admin@example.com',
        password: 'admin',
      }),
    );
    expect(component.isLoading).toBe(true);
  });

  it('should navigate to trainer dashboard for admin role when authenticated', () => {
    component.credential = 'admin@example.com';
    component.password = 'admin';
    component.onLogin();

    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      loading: false,
      user: { role: 'admin', id: '', username: 'admin', email: '' },
    });
    store.refreshState();

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/dashboard']);
  });

  it('should navigate to learner dashboard for user role when authenticated', () => {
    component.credential = 'user@example.com';
    component.password = 'user';
    component.onLogin();

    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      loading: false,
      user: { role: 'user', id: '', username: 'user', email: '' },
    });
    store.refreshState();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/dashboard']);
  });

  it('should clear previous error messages on new login attempt', () => {
    component.errorMessage = 'Previous error';
    component.credential = 'admin@example.com';
    component.password = 'admin';

    component.onLogin();

    expect(component.errorMessage).toBe('');
  });

  it('should trim whitespace from inputs', () => {
    component.credential = '  admin  ';
    component.password = '  admin  ';

    component.onLogin();

    expect(dispatchSpy).toHaveBeenCalledWith(
      AuthActions.login({
        credential: 'admin',
        password: 'admin',
      }),
    );
  });
});
