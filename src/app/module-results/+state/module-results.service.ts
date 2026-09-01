import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ModuleResultsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // ASSUMPTION: no module-result-detail controller was included in this
  // upload - mirrors the naming convention of the other per-resource "detail"
  // endpoints (e.g. users/:id, training-modules/:id). Update the path/
  // response mapping once a real contract exists.
  getModuleResult(moduleId: number) {
    return this.http.get<any>(`${this.apiEndpoint}module-results/${moduleId}`);
  }
}
