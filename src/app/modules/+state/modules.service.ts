import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { LearnerModule } from './module.model';

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

  // ASSUMPTION: mirrors the scenarios resource's Create/Read/Update/Delete
  // shape (see scenario.service.ts) since no dedicated module management
  // ticket/endpoint spec was included in this upload - update the path or
  // payload shape once a real "Module Management" contract lands.
  getModuleDetails(moduleId: number) {
    return this.http.get<LearnerModule>(
      `${this.apiEndpoint}training-modules/${moduleId}`,
    );
  }

  createModule(module: Partial<LearnerModule>) {
    return this.http.post<LearnerModule>(
      `${this.apiEndpoint}training-modules`,
      module,
    );
  }

  updateModule(moduleId: number, updatedModule: Partial<LearnerModule>) {
    return this.http.patch<LearnerModule>(
      `${this.apiEndpoint}training-modules/${moduleId}`,
      updatedModule,
    );
  }

  deleteModule(moduleId: number) {
    return this.http.delete(`${this.apiEndpoint}training-modules/${moduleId}`);
  }

  // Confirmed via GET /api-json: POST /training-modules/{moduleId}/assignments
  // with { userId } (AssignUserDto), "Assign a learner to a module (trainer
  // only)". There's no matching GET to list who's already assigned, so the
  // module-edit screen can't show existing assignments - only add new ones.
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
