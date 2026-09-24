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
  // The four fields below are only present on GET /users/learners
  // (LearnerResponseDto) - absent for trainers and for the plain UserAccount
  // returned by create/update/GET /users/trainers.
  progressPercentage?: number;
  averageScore?: number | null;
  lastActiveAt?: string | null;
  weaknesses?: string[];
}

/** Payload for POST /users (CreateUserDto). */
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserAccountRole;
  // Global admins only - see UsersService.createUser.
  organisationId?: number;
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
  progressPercentage?: number;
  averageScore?: number | null;
  lastActiveAt?: string | null;
  weaknesses?: string[];
}

// GET /users/learners (LearnerResponseDto) returns `weaknesses` as the
// scenario-category enum, weakest first - labels here match that enum's
// exact spelling (confirmed via the live GET /api-json schema). Kept
// separate from scenario.model.ts's ScenarioCategory/CATEGORY_OPTIONS since
// that enum has two confirmed backend typos (RANSONWARE,
// BUISINESS_EMAIL_COMPROMISE) that this endpoint's enum does not share.
// Shared by the learner list and the trainer reports page - anywhere a raw
// weakness code needs a human-readable label.
export const LEARNER_WEAKNESS_LABELS: Record<string, string> = {
  PHISHING: 'Phishing',
  SMISHING: 'Smishing (SMS)',
  VISHING: 'Vishing (Voice)',
  SOCIAL_ENGINEERING: 'Social Engineering',
  MALWARE: 'Malware',
  RANSOMWARE: 'Ransomware',
  BUSINESS_EMAIL_COMPROMISE: 'Business Email Compromise',
  SPEAR_PHISHING: 'Spear Phishing',
  WHALING: 'Whaling',
};

export function getWeaknessLabel(category: string): string {
  return LEARNER_WEAKNESS_LABELS[category] ?? category;
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
