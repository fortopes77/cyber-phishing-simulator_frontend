import { normalizeModule } from './module.model';

describe('normalizeModule', () => {
  it('keeps moduleId as-is when the backend already returns it', () => {
    const result = normalizeModule({
      moduleId: 1,
      moduleName: 'Phishing Awareness',
    });

    expect(result.moduleId).toBe(1);
  });

  it('falls back to `id` when moduleId is missing', () => {
    const result = normalizeModule({ id: 7, moduleName: 'Email Security' });

    expect(result.moduleId).toBe(7);
  });

  it('falls back to `_id` when neither moduleId nor id is present', () => {
    const result = normalizeModule({
      _id: '12',
      moduleName: 'Social Engineering',
    });

    expect(result.moduleId).toBe(12);
  });

  it('coerces a string id to a number', () => {
    const result = normalizeModule({ id: '4', moduleName: 'Malware' });

    expect(result.moduleId).toBe(4);
    expect(typeof result.moduleId).toBe('number');
  });

  it('falls back to `title` when moduleName is missing - the actual shape GET /training-modules returns', () => {
    const result = normalizeModule({ id: 1, title: 'Email Phishing Fundamentals' });

    expect(result.moduleName).toBe('Email Phishing Fundamentals');
  });

  it('prefers moduleName over title when both are present', () => {
    const result = normalizeModule({
      id: 1,
      moduleName: 'Phishing Awareness',
      title: 'Should be ignored',
    });

    expect(result.moduleName).toBe('Phishing Awareness');
  });

  it('preserves every other field unchanged', () => {
    const result = normalizeModule({
      id: 1,
      moduleName: 'Phishing Awareness',
      description: 'Learn to spot phishing',
      version: '1.0.0',
    });

    expect(result.moduleName).toBe('Phishing Awareness');
    expect(result.description).toBe('Learn to spot phishing');
    expect(result.version).toBe('1.0.0');
  });
});
