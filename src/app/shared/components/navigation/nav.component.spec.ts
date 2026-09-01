import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { AuthActions } from '../../../auth/+state/auth.actions';
import { selectAuthState } from '../../../auth/+state/auth.selectors';

import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let store: MockStore;
  let actions$: Observable<any>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getFeedback']);
    actions$ = of();

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
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the sign-out modal instead of navigating immediately', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.logout();

    expect(component.signOutModalOpen).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to /sign-out once sign-out is confirmed', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.signOutModalOpen = true;

    component.confirmSignOut();

    expect(component.signOutModalOpen).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/sign-out']);
  });

  it('should close the modal without navigating when sign-out is cancelled', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.signOutModalOpen = true;

    component.cancelSignOut();

    expect(component.signOutModalOpen).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should open the profile modal when the account card is clicked', () => {
    component.openProfileModal();
    expect(component.profileModalOpen).toBeTrue();
  });

  it('should dispatch updateProfile with the signed-in user id and mark saving on saveProfile', () => {
    component.currentUser = {
      id: '1',
      username: 'ava',
      email: 'ava@example.com',
      role: 'user',
    };

    component.saveProfile({
      firstName: 'Ava',
      lastName: 'Morales',
      email: 'ava@example.com',
    });

    expect(component.profileSaving).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.updateProfile({
        userId: '1',
        firstName: 'Ava',
        lastName: 'Morales',
        email: 'ava@example.com',
      }),
    );
  });

  it('should not dispatch updateProfile when there is no signed-in user', () => {
    component.currentUser = undefined;

    component.saveProfile({
      firstName: 'Ava',
      lastName: 'Morales',
      email: 'ava@example.com',
    });

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch changePassword with the signed-in user id and mark saving on savePassword', () => {
    component.currentUser = {
      id: '1',
      username: 'ava',
      email: 'ava@example.com',
      role: 'user',
    };

    component.savePassword({ newPassword: 'new' });

    expect(component.passwordSaving).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.changePassword({ userId: '1', newPassword: 'new' }),
    );
  });

  it('should not dispatch changePassword when there is no signed-in user', () => {
    component.currentUser = undefined;

    component.savePassword({ newPassword: 'new' });

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should clear saving and mark saved when updateProfileSuccess is seen', () => {
    actions$ = of(AuthActions.updateProfileSuccess({ user: { id: '1' } as any }));
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    component.profileSaving = true;
    fixture.detectChanges();

    expect(component.profileSaving).toBeFalse();
    expect(component.profileSaved).toBeTrue();
  });

  it('should surface the error when updateProfileFailure is seen', () => {
    actions$ = of(AuthActions.updateProfileFailure({ error: 'Email already in use' }));
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    component.profileSaving = true;
    fixture.detectChanges();

    expect(component.profileSaving).toBeFalse();
    expect(component.profileError).toBe('Email already in use');
  });

  it('should clear saving and mark saved when changePasswordSuccess is seen', () => {
    actions$ = of(AuthActions.changePasswordSuccess());
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    component.passwordSaving = true;
    fixture.detectChanges();

    expect(component.passwordSaving).toBeFalse();
    expect(component.passwordSaved).toBeTrue();
  });

  it('should surface the error when changePasswordFailure is seen', () => {
    actions$ = of(AuthActions.changePasswordFailure({ error: 'Failed to change password' }));
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    component.passwordSaving = true;
    fixture.detectChanges();

    expect(component.passwordSaving).toBeFalse();
    expect(component.passwordError).toBe('Failed to change password');
  });
});
