export type UserAccountRole = 'trainer' | 'user';
export type UserAccountStatus = 'active' | 'inactive';

/**
 * A learner/trainer account as managed from the trainer's "Learners" screen -
 * distinct from auth.service.ts's `User` (the currently signed-in session's
 * identity). This is the shape of the account resource itself: who they are
 * and what role/status they hold, not their learning progress (which comes
 * from the modules/scenarios/attempts domains instead).
 */
export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: UserAccountRole;
  status?: UserAccountStatus;
}
