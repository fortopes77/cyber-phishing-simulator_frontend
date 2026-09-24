import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ScenarioAnswerMode, toScenarioPayload } from '../models/scenario.model';

@Injectable({
  providedIn: 'root',
})
export class ScenarioService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';
  private aiApiEndpoint = environment.aiApiUrl || 'http://localhost:8000/';

  constructor(private http: HttpClient) {}

  // organisationId is only honoured for a global admin (see
  // ScenarioActions.fetchList). Authorization header is attached by
  // authInterceptor from the store.
  getScenarios(organisationId?: number | null) {
    return this.http.get(
      `${this.apiEndpoint}scenarios`,
      organisationId != null ? { params: { organisationId } } : {},
    );
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
    return this.http.get(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }

  createScenario(scenario: any) {
    return this.http.post(`${this.apiEndpoint}scenarios`, toScenarioPayload(scenario));
  }

  // 'simple' scenarios ask the AI API for a single correctAnswer
  // (Safe/Suspicious); 'detailed' scenarios ask for the correctCues list
  // instead - same downstream workflow either way (see
  // ScenarioListComponent.subscribeToAIScenarioCreateSuccess and
  // toScenarioPayload, which already picks whichever field is present).
  createScenarioWithAI(answerMode: ScenarioAnswerMode) {
    const path = answerMode === 'detailed' ? 'detailed-scenario' : 'simple-scenario';
    return this.http.get(this.aiApiEndpoint + path);
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
