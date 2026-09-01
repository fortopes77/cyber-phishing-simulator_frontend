export type UserAccountRole = 'trainer' | 'user';

/**
 * A learner/trainer account as managed from the trainer's "Learners" screen -
 * distinct from auth.service.ts's `User` (the currently signed-in session's
 * identity), though both wrap the same backend `/users` resource. This is
 * the shape of the account itself: who they are and what role they hold,
 * not their learning progress (which comes from the modules/scenarios/
 * attempts domains instead).
 */
export interface UserAccount {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  // Derived, not sent by the backend - convenient for display (list rows,
  // headings) since the API only returns firstName/lastName separately.
  fullName: string;
  email: string;
  role: UserAccountRole;
  organisationId?: number;
}

/** Payload for POST /users (CreateUserDto). */
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserAccountRole;
}

/**
 * Payload for PATCH /users/{id} (UpdateUserDto) - deliberately narrower than
 * UserAccount: the backend has no field to change `username` or `role` this
 * way, only email/password/firstName/lastName.
 */
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

/**
 * The `/users` resource exactly as the backend returns it - role as
 * "LEARNER"/"TRAINER", no `fullName`. What UsersService's HTTP calls are
 * typed to return; normalizeUserAccount() turns this into a UserAccount.
 */
export interface RawUserAccount {
  id: number | string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organisationId?: number;
}

const ROLE_MAP: Record<string, UserAccountRole> = {
  TRAINER: 'trainer',
  LEARNER: 'user',
};

/**
 * Normalizes a raw `/users` API response (role as "LEARNER"/"TRAINER", no
 * `fullName`) into a UserAccount - mirrors auth.service.ts's normalizeUser,
 * kept separate since it also derives `fullName` for display.
 */
export function normalizeUserAccount(raw: RawUserAccount): UserAccount {
  const rawRole = (raw?.role ?? '').toString().toUpperCase();
  const firstName = raw?.firstName ?? '';
  const lastName = raw?.lastName ?? '';

  return {
    ...raw,
    id: String(raw?.id),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    role: ROLE_MAP[rawRole] ?? rawRole.toLowerCase(),
  };
}
