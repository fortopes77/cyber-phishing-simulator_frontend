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
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.get(`${this.apiEndpoint}scenarios`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  getScenariosByModule(moduleId: number) {
    // ASSUMPTION: the scenarios endpoint accepts a moduleId query param to
    // scope the list to a single module. Update this if your NestJS
    // controller uses a different route (e.g. modules/:id/scenarios).
    // moduleId is numeric throughout the app (see LearnerModule and
    // ScenariosService.createScenario), matching the backend's module PK.
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.get(`${this.apiEndpoint}scenarios`, {
      params: { moduleId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  getScenarioDetails(scenarioId: string) {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get(`/mock/scenarios/get/scenario-details-${scenarioId}.mock.json`);
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.get(`${this.apiEndpoint}scenarios/${scenarioId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  createScenario(scenario: any) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.post(
      `${this.apiEndpoint}scenarios`,
      toScenarioPayload(scenario),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
  }

  createScenarioWithAI() {
    return this.http.get(this.aiApiEndpoint + 'simple-scenario');
  }

  updateScenario(scenarioId: string, updatedScenario: any) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.patch(
      `${this.apiEndpoint}scenarios/${scenarioId}`,
      toScenarioPayload(updatedScenario),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
  }

  deleteScenario(scenarioId: string) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.delete(`${this.apiEndpoint}scenarios/${scenarioId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
