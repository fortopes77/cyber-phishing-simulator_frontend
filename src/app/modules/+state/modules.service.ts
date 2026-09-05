import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { LearnerModule, toModulePayload } from './module.model';

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // Confirmed live via GET /api-json: GET /training-modules takes a single
  // optional `assignedToMe` boolean - "List training modules, optionally
  // filtered to the current user's assigned modules" - self-scoped via the
  // JWT, no userId/organisationId needed. Verified live: assignedToMe=true
  // returns [] for a learner with no assignments while omitting it (or
  // false) returns every module in the org.
  getModules(assignedToMe?: boolean) {
    // Authorization header is attached by authInterceptor from the store.
    return this.http.get<LearnerModule[] | { modules: LearnerModule[] }>(
      `${this.apiEndpoint}training-modules`,
      assignedToMe ? { params: { assignedToMe: true } } : {},
    );
  }

  // Confirmed live via GET /api-json: GET /training-modules/{id} - "Get a
  // single module, including its scenarios".
  getModuleDetails(moduleId: number) {
    return this.http.get<LearnerModule>(
      `${this.apiEndpoint}training-modules/${moduleId}`,
    );
  }

  // Confirmed live via GET /api-json: POST /training-modules
  // (CreateTrainingModuleDto: title + description, no moduleName/version) -
  // "Create a new training module (trainer & admin only)".
  createModule(module: Partial<LearnerModule>) {
    return this.http.post<LearnerModule>(
      `${this.apiEndpoint}training-modules`,
      toModulePayload(module),
    );
  }

  // Confirmed live via GET /api-json: PATCH /training-modules/{id}
  // (UpdateTrainingModuleDto - same shape as create) - "Update a training
  // module (admin & trainer only)".
  updateModule(moduleId: number, updatedModule: Partial<LearnerModule>) {
    return this.http.patch<LearnerModule>(
      `${this.apiEndpoint}training-modules/${moduleId}`,
      toModulePayload(updatedModule),
    );
  }

  deleteModule(moduleId: number) {
    return this.http.delete(`${this.apiEndpoint}training-modules/${moduleId}`);
  }

  // Confirmed via GET /api-json: POST /training-modules/{moduleId}/assignments
  // with { userId } (AssignUserDto), "Assign a learner to a module (trainer
  // only)". Still no dedicated GET for this - who's already assigned comes
  // from getModuleDetails's assignedUserIds instead (see
  // normalizeAssignedUserIds in module.model.ts).
  assignLearner(moduleId: number, userId: number) {
    return this.http.post(
      `${this.apiEndpoint}training-modules/${moduleId}/assignments`,
      { userId },
    );
  }

  // Confirmed via GET /api-json: DELETE /training-modules/{moduleId}/
  // assignments/{userId}, "Unassign a learner from a module (trainer only)".
  unassignLearner(moduleId: number, userId: number) {
    return this.http.delete(
      `${this.apiEndpoint}training-modules/${moduleId}/assignments/${userId}`,
    );
  }
}
