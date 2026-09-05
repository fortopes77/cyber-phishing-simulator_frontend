import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ModulesService } from './modules.service';
import { environment } from 'src/environments/environment';
import { LearnerModule } from './module.model';

describe('ModulesService', () => {
  let service: ModulesService;
  let httpMock: HttpTestingController;

  const modules: LearnerModule[] = [
    { moduleId: 1, moduleName: 'Phishing Awareness', description: 'Learn to spot phishing' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ModulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET every module in the org when assignedToMe is not given', () => {
    service.getModules().subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${environment.apiUrl}training-modules`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('assignedToMe')).toBeFalse();
    req.flush(modules);
  });

  it('should scope the request to the signed-in learner when assignedToMe is true', () => {
    service.getModules(true).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${environment.apiUrl}training-modules`,
    );
    expect(req.request.params.get('assignedToMe')).toBe('true');
    req.flush(modules);
  });

  it('should GET a single module by id', () => {
    service.getModuleDetails(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}training-modules/1`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(modules[0]);
  });

  it('should POST a new module, translated to the { title, description } shape the backend accepts', () => {
    const newModule = { moduleName: 'New Module', description: 'desc' };
    service.createModule(newModule).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}training-modules`,
    );
    expect(req.request.method).toBe('POST');
    // Confirmed live via GET /api-json: CreateTrainingModuleDto only accepts
    // title/description - sending moduleName (or a version field) 400s with
    // "property moduleName should not exist".
    expect(req.request.body).toEqual({ title: 'New Module', description: 'desc' });
    req.flush({ moduleId: 2, title: newModule.moduleName, description: newModule.description });
  });

  it('should PATCH an existing module, translated to the { title, description } shape the backend accepts', () => {
    const updatedModule = { moduleName: 'Updated Module', description: 'Updated description' };
    service.updateModule(1, updatedModule).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}training-modules/1`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      title: 'Updated Module',
      description: 'Updated description',
    });
    req.flush({ ...modules[0], title: updatedModule.moduleName, description: updatedModule.description });
  });

  it('should DELETE a module', () => {
    service.deleteModule(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}training-modules/1`,
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
