import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { toScenarioPayload } from '../models/scenario.model';

@Injectable({
  providedIn: 'root',
})
export class ScenarioService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';
  private aiApiEndpoint = environment.aiApiUrl || 'http://localhost:8000/';

  constructor(private http: HttpClient) {}

  getScenarios() {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get('/mock/scenarios/get/scenario-list.mock.json');
    // Authorization header is attached by authInterceptor from the store.
    return this.http.get(`${this.apiEndpoint}scenarios`);
  }

  getScenariosByModule(moduleId: number) {
    // ASSUMPTION: the scenarios endpoint accepts a moduleId query param to
    // scope the list to a single module. Update this if your NestJS
    // controller uses a different route (e.g. modules/:id/scenarios).
    // moduleId is numeric throughout the app (see LearnerModule and
    // ScenariosService.createScenario), matching the backend's module PK.
    return this.http.get(`${this.apiEndpoint}scenarios`, {
      params: { moduleId },
    });
  }

  getScenarioDetails(scenarioId: string) {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get(`/mock/scenarios/get/scenario-details-${scenarioId}.mock.json`);
    return this.http.get(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }

  createScenario(scenario: any) {
    return this.http.post(`${this.apiEndpoint}scenarios`, toScenarioPayload(scenario));
  }

  createScenarioWithAI() {
    return this.http.get(this.aiApiEndpoint + 'simple-scenario');
  }

  updateScenario(scenarioId: string, updatedScenario: any) {
    return this.http.patch(
      `${this.apiEndpoint}scenarios/${scenarioId}`,
      toScenarioPayload(updatedScenario),
    );
  }

  deleteScenario(scenarioId: string) {
    return this.http.delete(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }
}
