/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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

  it('should show error on login failure', () => {
    component.credential = 'invalid';
    component.password = 'invalid';
    authService.login.and.returnValue(of(false) as any);
    component.onLogin();
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Invalid username/email or password');
    expect(component.isLoading).toBe(false);
  });

  it('should navigate to trainer dashboard for admin role', () => {
    component.credential = 'admin';
    component.password = 'admin';
    authService.login.and.returnValue(of(true) as any);
    authService.getCurrentUser.and.returnValue({
      role: 'admin',
      id: '',
      username: '',
      email: '',
    });
    component.onLogin();
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/dashboard']);
  });

  it('should navigate to learner dashboard for user role', () => {
    component.credential = 'user';
    component.password = 'user';
    authService.login.and.returnValue(of(true) as any);
    authService.getCurrentUser.and.returnValue({
      role: 'user',
      id: '',
      username: '',
      email: '',
    });
    component.onLogin();
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/dashboard']);
  });

  it('should clear previous error messages on new login attempt', () => {
    component.errorMessage = 'Previous error';
    component.credential = 'admin';
    component.password = 'admin';
    authService.login.and.returnValue(of(true) as any);
    authService.getCurrentUser.and.returnValue({
      role: 'admin',
      id: '',
      username: '',
      email: '',
    });
    component.onLogin();
    fixture.detectChanges();
    expect(component.errorMessage).toBe('');
  });

  it('should trim whitespace from inputs', () => {
    component.credential = '  admin  ';
    component.password = '  admin  ';
    authService.login.and.returnValue(of(true) as any);
    authService.getCurrentUser.and.returnValue({
      role: 'admin',
      id: '',
      username: '',
      email: '',
    });
    component.onLogin();
    fixture.detectChanges();
    expect(authService.login).toHaveBeenCalledWith('admin', 'admin');
  });
});
