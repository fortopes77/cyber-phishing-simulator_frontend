import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { UserEditComponent } from './user-edit.component';
import { UsersActions } from '../../+state/users.actions';
import { selectUser } from '../../+state/users.selectors';
import { AuthActions } from 'src/app/auth/+state/auth.actions';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [UserEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectUser, value: null }],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the edit form controls and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('First name');
    expect(compiled.textContent).toContain('Last name');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should disable username and role in edit mode, since the backend cannot change them', () => {
    expect(component.userForm.get('username')?.disabled).toBeTrue();
    expect(component.userForm.get('role')?.disabled).toBeTrue();
  });

  it('should read the user id from the route and fetch its details', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('u_42');

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.userId).toBe('u_42');
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.fetchUserDetails({ userId: 'u_42' }),
    );
  });

  it('should detect create mode from the route and skip fetching details', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as any).url = [{ path: 'create' }];

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isCreateMode).toBeTrue();
  });

  describe('creating a trainer from /trainer/trainers/create', () => {
    function createFromTrainersRoute(): void {
      const route = TestBed.inject(ActivatedRoute);
      (route.snapshot as any).url = [{ path: 'trainers' }, { path: 'create' }];

      fixture = TestBed.createComponent(UserEditComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }

    it('should lock the role field to trainer and detect create mode', () => {
      createFromTrainersRoute();

      expect(component.isCreateMode).toBeTrue();
      expect(component.managingRole).toBe('trainer');
      expect(component.userForm.get('role')?.value).toBe('trainer');
      expect(component.userForm.get('role')?.disabled).toBeTrue();
    });

    it('should show "Add Trainer" as the page title', () => {
      createFromTrainersRoute();

      expect(fixture.nativeElement.textContent).toContain('Add Trainer');
    });

    it('should dispatch createUser with role trainer even though the role control is disabled', () => {
      createFromTrainersRoute();
      component.userForm.patchValue({
        username: 'new.trainer',
        firstName: 'New',
        lastName: 'Trainer',
        email: 'new.trainer@example.com',
        password: 'Password1!',
      });

      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: UsersActions.createUser.type,
          user: jasmine.objectContaining({ role: 'trainer' }),
        }),
      );
    });

    it('should navigate back to the trainers list, not the learners list, on cancel', () => {
      createFromTrainersRoute();

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/trainers']);
    });

    it('should navigate to the trainers list once createUserSuccess fires', () => {
      createFromTrainersRoute();
      (router.navigate as jasmine.Spy).calls.reset();

      actions$ = of(
        UsersActions.createUserSuccess({
          user: {
            id: 'u_9',
            username: 'new.trainer',
            firstName: 'New',
            lastName: 'Trainer',
            fullName: 'New Trainer',
            email: 'new.trainer@example.com',
            role: 'trainer',
          },
        }),
      );
      const route = TestBed.inject(ActivatedRoute);
      (route.snapshot as any).url = [{ path: 'trainers' }, { path: 'create' }];
      fixture = TestBed.createComponent(UserEditComponent);
      fixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/trainers']);
    });
  });

  it('should lock the role field to learner when creating from /trainer/learners/create', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as any).url = [{ path: 'learners' }, { path: 'create' }];

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.managingRole).toBe('user');
    expect(component.userForm.get('role')?.value).toBe('user');
    expect(component.userForm.get('role')?.disabled).toBeTrue();
  });

  it('should dispatch createUser with the form values, mapped role and password, in create mode', () => {
    component.isCreateMode = true;
    component.userForm.setValue({
      username: 'ava.morales',
      firstName: 'Ava',
      lastName: 'Morales',
      email: 'ava.morales@example.com',
      password: 'Password1!',
      role: 'user',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.createUser({
        user: {
          username: 'ava.morales',
          firstName: 'Ava',
          lastName: 'Morales',
          email: 'ava.morales@example.com',
          password: 'Password1!',
          role: 'user',
        },
      }),
    );
  });

  it('should dispatch updateUser without username/role/password when the password field is left blank', () => {
    component.isCreateMode = false;
    component.userId = 'u_7';
    component.userForm.get('username')?.disable();
    component.userForm.get('role')?.disable();
    component.userForm.patchValue({
      firstName: 'Noah',
      lastName: 'Bennett',
      email: 'noah.bennett@example.com',
      password: '',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.updateUser({
        userId: 'u_7',
        updatedUser: {
          firstName: 'Noah',
          lastName: 'Bennett',
          email: 'noah.bennett@example.com',
        },
      }),
    );
  });

  it('should include the password in updateUser when one was entered', () => {
    component.isCreateMode = false;
    component.userId = 'u_7';
    component.userForm.get('username')?.disable();
    component.userForm.get('role')?.disable();
    component.userForm.patchValue({
      firstName: 'Noah',
      lastName: 'Bennett',
      email: 'noah.bennett@example.com',
      password: 'NewPassword1!',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.updateUser({
        userId: 'u_7',
        updatedUser: {
          firstName: 'Noah',
          lastName: 'Bennett',
          email: 'noah.bennett@example.com',
          password: 'NewPassword1!',
        },
      }),
    );
  });

  it('should not dispatch when the form is invalid', () => {
    component.userForm.patchValue({
      firstName: '',
      email: 'not-an-email',
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate back to the learners list on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/learners']);
  });

  describe('forgot password', () => {
    const loadedUser = {
      id: 'u_1',
      username: 'ava.morales',
      firstName: 'Ava',
      lastName: 'Morales',
      fullName: 'Ava Morales',
      email: 'ava.morales@example.com',
      role: 'user' as const,
    };

    it('should show the button in edit mode but not in create mode', () => {
      expect(fixture.nativeElement.textContent).toContain('Send Password Reset Email');

      component.isCreateMode = true;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('Send Password Reset Email');
    });

    it("should dispatch forgotPassword with the loaded user's email on confirm", () => {
      store.overrideSelector(selectUser, loadedUser);
      store.refreshState();

      component.openForgotPasswordModal();
      component.confirmForgotPassword();

      expect(component.forgotPasswordSending).toBeTrue();
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.forgotPassword({ email: 'ava.morales@example.com' }),
      );
    });

    it('should not dispatch when no user has been loaded yet', () => {
      component.confirmForgotPassword();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should close the forgot-password modal without dispatching on cancel', () => {
      component.openForgotPasswordModal();
      component.cancelForgotPassword();

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(component.isForgotPasswordModalOpen).toBeFalse();
    });

    it('should clear sending and close the modal when forgotPasswordSuccess is seen', () => {
      actions$ = of(AuthActions.forgotPasswordSuccess());
      fixture = TestBed.createComponent(UserEditComponent);
      component = fixture.componentInstance;
      component.isForgotPasswordModalOpen = true;
      component.forgotPasswordSending = true;

      fixture.detectChanges();

      expect(component.forgotPasswordSending).toBeFalse();
      expect(component.isForgotPasswordModalOpen).toBeFalse();
    });

    it('should surface the error when forgotPasswordFailure is seen', () => {
      actions$ = of(
        AuthActions.forgotPasswordFailure({ error: 'Failed to send password reset email' }),
      );
      fixture = TestBed.createComponent(UserEditComponent);
      component = fixture.componentInstance;
      component.forgotPasswordSending = true;

      fixture.detectChanges();

      expect(component.forgotPasswordSending).toBeFalse();
      expect(component.forgotPasswordError).toBe('Failed to send password reset email');
    });
  });
});
