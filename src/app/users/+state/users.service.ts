import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  CreateUserPayload,
  RawUserAccount,
  UpdateUserPayload,
  UserAccount,
} from './user-account.model';

const ROLE_TO_API: Record<UserAccount['role'], string> = {
  trainer: 'TRAINER',
  user: 'LEARNER',
};

function organisationParams(organisationId: number | null) {
  return organisationId != null ? { params: { organisationId } } : {};
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // GET /users - list all users - doesn't exist on this backend; only
  // GET /users/learners (staff only) is exposed, per the Swagger contract.
  // Its LearnerResponseDto also carries progressPercentage/averageScore/
  // lastActiveAt/weaknesses per learner. A trainer is always scoped to their
  // own organisation; a global admin sees every organisation unless
  // organisationId narrows it, so a null organisationId omits the param.
  getUsers(organisationId: number | null) {
    return this.http.get<RawUserAccount[] | { users: RawUserAccount[] }>(
      `${this.apiEndpoint}users/learners`,
      organisationParams(organisationId),
    );
  }

  getTrainers(organisationId: number | null) {
    return this.http.get<RawUserAccount[] | { users: RawUserAccount[] }>(
      `${this.apiEndpoint}users/trainers`,
      organisationParams(organisationId),
    );
  }

  getUserDetails(userId: string) {
    return this.http.get<RawUserAccount>(`${this.apiEndpoint}users/${userId}`);
  }

  // POST /users (CreateUserDto) - staff only. A trainer's own organisation
  // is inferred server-side, so organisationId is only set (and required by
  // the backend) when a global admin creates the account.
  createUser(user: CreateUserPayload) {
    return this.http.post<RawUserAccount>(`${this.apiEndpoint}users`, {
      ...user,
      role: ROLE_TO_API[user.role],
    });
  }

  // PATCH /users/{id} (UpdateUserDto) - email/password/firstName/lastName
  // only; the backend has no field to change username or role.
  updateUser(userId: string, updatedUser: UpdateUserPayload) {
    return this.http.patch<RawUserAccount>(
      `${this.apiEndpoint}users/${userId}`,
      updatedUser,
    );
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.apiEndpoint}users/${userId}`);
  }

  // No dedicated reset-password route exists - PATCH /users/{id} accepts an
  // optional `password` field (UpdateUserDto), so a trainer resetting
  // someone else's password reuses the same update endpoint.
  resetPassword(userId: string, newPassword: string) {
    return this.http.patch<RawUserAccount>(`${this.apiEndpoint}users/${userId}`, {
      password: newPassword,
    });
  }

}
