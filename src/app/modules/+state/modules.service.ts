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
  // differs.
  getModules() {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.get<LearnerModule[] | { modules: LearnerModule[] }>(
      `${this.apiEndpoint}training-modules`,
      {
        params: { organisationId: 1 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
  }
}
