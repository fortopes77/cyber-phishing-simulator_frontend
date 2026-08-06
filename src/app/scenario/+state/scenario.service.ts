import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ScenarioService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  getScenarios() {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get('/mock/scenarios/get/scenario-list.mock.json');
    return this.http.get(`${this.apiEndpoint}scenarios`);
  }

  getScenarioDetails(scenarioId: string) {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get(`/mock/scenarios/get/scenario-details-${scenarioId}.mock.json`);
    return this.http.get(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }

  createScenario(scenario: any) {
    const newScenario = {
      moduleId: 2,
      title: scenario.title,
      content: scenario.emailBody,
      category: scenario.category,
      difficulty: scenario.difficulty,
      interactionType: scenario.interactionType,
      scenarioDescription: scenario.scenarioDescription,
      sender: scenario.sender,
      recipient: scenario.recipient,
      subject: scenario.subject,
    };
    return this.http.post(`${this.apiEndpoint}scenarios`, newScenario);
  }

  createScenarioWithAI() {
    return this.http.get('http://localhost:8000/simple-scenario');
  }

  updateScenario(scenarioId: string, updatedScenario: any) {
    return this.http.patch(
      `${this.apiEndpoint}scenarios/${scenarioId}`,
      updatedScenario,
    );
  }

  deleteScenario(scenarioId: string) {
    return this.http.delete(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }
}
