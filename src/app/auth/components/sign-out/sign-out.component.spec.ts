import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AuthService } from '../../auth.service';
import { AuthActions } from '../../+state/auth.actions';

import { SignOutComponent } from './sign-out.component';

describe('SignOutComponent', () => {
  let component: SignOutComponent;
  let fixture: ComponentFixture<SignOutComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [SignOutComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(SignOutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch logout after the view initializes', fakeAsync(() => {
    // ngAfterViewInit's setTimeout must be scheduled inside this fakeAsync
    // zone for tick() to flush it - detectChanges() (which triggers
    // ngAfterViewInit) has to happen here, not in beforeEach.
    fixture.detectChanges();
    tick();
    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
  }));

  it('should navigate to /login when "Back to Login" is clicked', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.backToLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
