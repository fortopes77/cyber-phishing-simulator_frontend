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

  // ASSUMPTION: no NestJS module controller was included in this upload, so
  // this mirrors the shape of src/mock/module-list-learner.json
  // (moduleId/moduleName/description/hasUserCompleted/score/timeSpent).
  // Update the path/mapping in modules.effects.ts if your real endpoint
  // differs. `userId`, when supplied, asks for just that learner's assigned
  // modules (see PHISH-311 "Module Assignment") rather than every module in
  // the org - omitted entirely for trainer-facing catalog views.
  getModules(userId?: string) {
    // Authorization header is attached by authInterceptor from the store.
    return this.http.get<LearnerModule[] | { modules: LearnerModule[] }>(
      `${this.apiEndpoint}training-modules`,
      {
        params: userId
          ? { organisationId: 1, userId }
          : { organisationId: 1 },
      },
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
}
