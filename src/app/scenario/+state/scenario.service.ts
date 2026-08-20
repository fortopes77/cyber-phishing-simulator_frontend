import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

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

  getScenarioDetails(scenarioId: string) {
    // If your mock folder is served from the web root as /mock/... use an absolute path
    // that starts with a leading slash so it resolves from the server root.
    // return this.http.get(`/mock/scenarios/get/scenario-details-${scenarioId}.mock.json`);
    return this.http.get(`${this.apiEndpoint}scenarios/${scenarioId}`);
  }

  createScenario(scenario: any) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    const newScenario = {
      moduleId: 2, //This is going to be matched based on what the user selects in the module dropdown. For now, we are hardcoding it to 2.
      title: scenario.title,
      content: scenario.emailBody,
      category: scenario.category,
      difficulty: scenario.difficulty,
      interactionType: scenario.interactionType,
      scenarioDescription: scenario.scenarioDescription,
      sender: scenario.sender,
      recipient: scenario.recipient,
      subject: scenario.subject,
      correctActionExplanation: scenario.correctAnswer,
      choices: [{ text: 'test', isCorrect: true, feedback: 'yes' }], //This is going to be matched based on the AI API response. For now, we are hardcoding it to a single choice.
      cues: [{ text: 'test', isCorrect: true }], //This is going to be matched based on the AI API response. For now, we are hardcoding it to a single cue.
    };
    return this.http.post(`${this.apiEndpoint}scenarios`, newScenario, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  createScenarioWithAI() {
    return this.http.get(this.aiApiEndpoint + 'simple-scenario');
  }

  updateScenario(scenarioId: string, updatedScenario: any) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.patch(
      `${this.apiEndpoint}scenarios/${scenarioId}`,
      updatedScenario,
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
