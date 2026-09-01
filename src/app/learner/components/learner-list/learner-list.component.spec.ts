import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { LearnerListComponent } from './learner-list.component';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectUserList } from 'src/app/users/+state/users.selectors';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { UserAccount } from 'src/app/users/+state/user-account.model';

describe('LearnerListComponent', () => {
  let component: LearnerListComponent;
  let fixture: ComponentFixture<LearnerListComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  // 10 fixture learners, ids 1-10 - buildLearnerRows derives each row's
  // mock progress/score/last-active/weaknesses deterministically from the
  // numeric id, so this spread gives every threshold-based test (weakness
  // overflow, last-active filtering, score variants) something to assert on.
  const mockUsers: UserAccount[] = Array.from({ length: 10 }, (_, i) => {
    const id = String(i + 1);
    return {
      id,
      username: `learner${id}`,
      firstName: `Learner${id}`,
      lastName: 'Test',
      fullName: `Learner${id} Test`,
      email: `learner${id}@example.com`,
      role: 'user',
      organisationId: 1,
    };
  });

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [
        LearnerListComponent,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectUserList, value: mockUsers },
            {
              selector: selectAuthState,
              value: {
                isAuthenticated: true,
                loading: false,
                user: { id: '99', username: 't', email: 't@t.com', role: 'trainer', organisationId: 1 },
              },
            },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LearnerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should dispatch fetchList with the trainer's organisationId on init", () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.fetchList({ organisationId: 1 }),
    );
  });

  it('should seed the learner list from the store with learner rows', () => {
    expect(component.rows.length).toBe(mockUsers.length);
    expect(component.rows[0].fullName).toBe('Learner1 Test');
    expect(component.rows[0].email).toBe('learner1@example.com');
    expect(component.columns.length).toBeGreaterThan(0);
    expect(
      component.columns.some((column) => column.key === 'weaknesses'),
    ).toBeTrue();
  });

  it('should expose edit, delete and reset password actions per learner', () => {
    expect(component.actions.length).toBe(3);
    expect(component.actions[0].label).toBe('Edit');
    expect(component.actions[1].label).toBe('Delete');
    expect(component.actions[2].label).toBe('Reset Password');
  });

  it('should compute the summary stats from the learner rows', () => {
    expect(component.totalLearners).toBe(component.rows.length);
    expect(component.highPerformers).toBe(
      component.rows.filter((row) => row.avgScore >= 85).length,
    );
    expect(component.needsAttention).toBe(
      component.rows.filter((row) => row.avgScore < 60).length,
    );
    expect(component.averageCompletion).toBeGreaterThanOrEqual(0);
    expect(component.averageCompletion).toBeLessThanOrEqual(100);
  });

  it('should show every row in filteredRows when no last-active range is applied', () => {
    expect(component.filteredRows.length).toBe(component.rows.length);
  });

  it('should narrow filteredRows and recompute stats when a last-active range is applied', () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    component.onLastActiveRangeChange({ start: startOfToday, end: endOfToday });

    expect(component.filteredRows.length).toBeGreaterThan(0);
    expect(component.filteredRows.length).toBeLessThan(component.rows.length);
    expect(
      component.filteredRows.every(
        (row) => row.lastActiveDate.getTime() >= startOfToday.getTime(),
      ),
    ).toBeTrue();
    expect(component.totalLearners).toBe(component.filteredRows.length);
  });

  it('should restore every row when the last-active range is cleared', () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    component.onLastActiveRangeChange({ start: startOfToday, end: new Date() });
    component.onLastActiveRangeChange({ start: null, end: null });

    expect(component.filteredRows.length).toBe(component.rows.length);
  });

  it('should classify score variants by threshold', () => {
    expect(component.scoreVariant(90)).toBe('success');
    expect(component.scoreVariant(70)).toBe('warning');
    expect(component.scoreVariant(40)).toBe('danger');
  });

  it('should cap visible weaknesses and expose an overflow count', () => {
    const row = component.rows.find((r) => r.weaknesses.length > 2)!;
    expect(row).toBeTruthy();
    expect(component.visibleWeaknesses(row).length).toBe(2);
    expect(component.overflowWeaknessCount(row)).toBe(
      row.weaknesses.length - 2,
    );
  });

  it('should render the stat cards and learner table', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total Learners');
    expect(text).toContain('High Performers');
    expect(text).toContain('Needs Attention');
    expect(text).toContain('Average Completion');
    expect(text).toContain(component.rows[0].fullName);
  });

  it('should navigate to the create page from the header action', () => {
    component.createActions[0].action();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/learners/create']);
  });

  it('should navigate to the edit page for the selected learner', () => {
    component.actions[0].action(component.rows[0]);
    expect(router.navigate).toHaveBeenCalledWith([
      '/trainer/learners',
      String(component.rows[0].id),
      'edit',
    ]);
  });

  it('should open the delete modal with the selected learner', () => {
    component.actions[1].action(component.rows[0]);
    expect(component.isDeleteModalOpen).toBeTrue();
    expect(component.selectedLearnerName).toBe(component.rows[0].fullName);
  });

  it('should dispatch deleteUser on confirm and close the modal', () => {
    const firstRow = component.rows[0];

    component.actions[1].action(firstRow);
    component.confirmDelete();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.deleteUser({ userId: String(firstRow.id) }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
    expect(component.selectedLearnerRow).toBeNull();
  });

  it('should reflect the store dropping a deleted learner from the list', () => {
    const remaining = mockUsers.slice(1);
    store.overrideSelector(selectUserList, remaining);
    store.refreshState();

    expect(component.rows.length).toBe(remaining.length);
    expect(component.rows.find((row) => String(row.id) === mockUsers[0].id)).toBeUndefined();
  });

  it('should close the modal without dispatching on cancel', () => {
    component.actions[1].action(component.rows[0]);
    component.cancelDelete();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: UsersActions.deleteUser.type }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
  });

  it('should open the reset password modal with the selected learner', () => {
    component.actions[2].action(component.rows[0]);

    expect(component.isResetPasswordModalOpen).toBeTrue();
    expect(component.selectedResetPasswordUserName).toBe(component.rows[0].fullName);
  });

  it('should dispatch resetUserPassword on confirm', () => {
    const firstRow = component.rows[0];
    component.actions[2].action(firstRow);

    component.confirmResetPassword({ newPassword: 'newpassword1' });

    expect(component.resetPasswordLoading).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.resetUserPassword({
        userId: String(firstRow.id),
        newPassword: 'newpassword1',
      }),
    );
  });

  it('should close the reset password modal without dispatching on cancel', () => {
    component.actions[2].action(component.rows[0]);
    component.cancelResetPassword();

    expect(component.isResetPasswordModalOpen).toBeFalse();
  });

  it('should close the reset password modal when resetUserPasswordSuccess is seen', () => {
    const firstRow = component.rows[0];
    actions$ = of(UsersActions.resetUserPasswordSuccess({ userId: String(firstRow.id) }));
    fixture = TestBed.createComponent(LearnerListComponent);
    component = fixture.componentInstance;
    component.isResetPasswordModalOpen = true;
    component.resetPasswordLoading = true;

    fixture.detectChanges();

    expect(component.resetPasswordLoading).toBeFalse();
    expect(component.isResetPasswordModalOpen).toBeFalse();
  });

  it('should surface the error when resetUserPasswordFailure is seen', () => {
    actions$ = of(
      UsersActions.resetUserPasswordFailure({ error: 'Failed to reset password' }),
    );
    fixture = TestBed.createComponent(LearnerListComponent);
    component = fixture.componentInstance;
    component.resetPasswordLoading = true;

    fixture.detectChanges();

    expect(component.resetPasswordLoading).toBeFalse();
    expect(component.resetPasswordError).toBe('Failed to reset password');
  });
});
