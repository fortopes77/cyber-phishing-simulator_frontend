import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * The scenarios API only accepts these exact enum values (including its
 * "RANSONWARE"/"BUISINESS_EMAIL_COMPROMISE" typos), but the AI generator and
 * the manual create form both produce free-form/differently-cased strings.
 * Map whatever we're given onto the value the backend actually validates
 * against, keyed by an uppercased/underscored normalization of the input so
 * "Business Email Compromise", "business_email_compromise" etc. all match.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  PHISHING: 'PHISHING',
  SMISHING: 'SMISHING',
  VISHING: 'VISHING',
  SOCIAL_ENGINEERING: 'SOCIAL_ENGINEERING',
  MALWARE: 'MALWARE',
  RANSOMWARE: 'RANSONWARE',
  RANSONWARE: 'RANSONWARE',
  BUSINESS_EMAIL_COMPROMISE: 'BUISINESS_EMAIL_COMPROMISE',
  BUISINESS_EMAIL_COMPROMISE: 'BUISINESS_EMAIL_COMPROMISE',
  SPEAR_PHISHING: 'SPEAR_PHISHING',
  WHALING: 'WHALING',
};
const DEFAULT_CATEGORY = 'PHISHING';

const DIFFICULTY_ALIASES: Record<string, string> = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
};
const DEFAULT_DIFFICULTY = 'MEDIUM';

// Only this fictional domain is approved for scenario sender/recipient
// addresses so learners can never be emailed by a real-looking domain.
const APPROVED_FAKE_DOMAIN = 'trulyfake.com';

function normalizeEnum(
  raw: unknown,
  aliases: Record<string, string>,
  fallback: string,
): string {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return aliases[key] ?? fallback;
}

function toApprovedDomainEmail(raw: unknown, fallbackLocalPart: string): string {
  const value = String(raw ?? '').trim();
  const [localPartRaw] = value.split('@');
  const localPart =
    (localPartRaw || '').toLowerCase().replace(/[^a-z0-9.+_-]/g, '') ||
    fallbackLocalPart;

  return `${localPart}@${APPROVED_FAKE_DOMAIN}`;
}

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
    const newScenario = {
      moduleId: 5, //This is going to be matched based on what the user selects in the module dropdown. For now, we are hardcoding it to 2.
      title: scenario.title,
      content: scenario.emailBody,
      category: normalizeEnum(scenario.category, CATEGORY_ALIASES, DEFAULT_CATEGORY),
      difficulty: normalizeEnum(
        scenario.difficulty,
        DIFFICULTY_ALIASES,
        DEFAULT_DIFFICULTY,
      ),
      interactionType: scenario.interactionType,
      scenarioDescription: scenario.scenarioDescription,
      sender: toApprovedDomainEmail(scenario.sender, 'it-support'),
      recipient: toApprovedDomainEmail(scenario.recipient, 'employee'),
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
