import { normalizeLearnerResults } from './results.model';

describe('normalizeLearnerResults', () => {
  it('should flatten a module-grouped response (scenarios nested under each module)', () => {
    const result = normalizeLearnerResults([
      {
        moduleId: 1,
        scenarios: [
          { scenarioId: 10, correct: true },
          { scenarioId: 11, correct: false },
        ],
      },
      {
        moduleId: 2,
        scenarios: [{ scenarioId: 20, correct: true }],
      },
    ]);

    expect(result.scenarioResults).toEqual([
      { scenarioId: '10', moduleId: 1, correct: true },
      { scenarioId: '11', moduleId: 1, correct: false },
      { scenarioId: '20', moduleId: 2, correct: true },
    ]);
  });

  it('should read a flat response (moduleId already on each scenario result)', () => {
    const result = normalizeLearnerResults([
      { scenarioId: 10, moduleId: 1, correct: true },
      { scenarioId: 11, moduleId: 2, correct: false },
    ]);

    expect(result.scenarioResults).toEqual([
      { scenarioId: '10', moduleId: 1, correct: true },
      { scenarioId: '11', moduleId: 2, correct: false },
    ]);
  });

  it('should read the real GET /results/me envelope - { moduleResults, scenarioResults } - confirmed live', () => {
    expect(
      normalizeLearnerResults({ moduleResults: [], scenarioResults: [] }),
    ).toEqual({ scenarioResults: [], averageScore: null });

    expect(
      normalizeLearnerResults({
        moduleResults: [],
        scenarioResults: [{ scenarioId: 1, moduleId: 1, correct: true }],
      }).scenarioResults,
    ).toEqual([{ scenarioId: '1', moduleId: 1, correct: true }]);
  });

  it('should unwrap a { results: [...] } / { modules: [...] } / { data: [...] } envelope', () => {
    expect(
      normalizeLearnerResults({ results: [{ scenarioId: 1, correct: true }] })
        .scenarioResults,
    ).toEqual([{ scenarioId: '1', moduleId: null, correct: true }]);

    expect(
      normalizeLearnerResults({ modules: [{ scenarioId: 2, correct: true }] })
        .scenarioResults,
    ).toEqual([{ scenarioId: '2', moduleId: null, correct: true }]);

    expect(
      normalizeLearnerResults({ data: [{ scenarioId: 3, correct: true }] })
        .scenarioResults,
    ).toEqual([{ scenarioId: '3', moduleId: null, correct: true }]);
  });

  it('should accept isCorrect/passed as aliases for correct', () => {
    const result = normalizeLearnerResults([
      { scenarioId: 1, isCorrect: true },
      { scenarioId: 2, passed: true },
      { scenarioId: 3 },
    ]);

    expect(result.scenarioResults.map((r) => r.correct)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('should read an id field as a fallback for scenarioId', () => {
    const result = normalizeLearnerResults([{ id: 5, correct: true }]);

    expect(result.scenarioResults[0].scenarioId).toBe('5');
  });

  it("should read the backend's own averageScore/overallScore/score when present", () => {
    expect(normalizeLearnerResults({ averageScore: 75, results: [] }).averageScore).toBe(75);
    expect(normalizeLearnerResults({ overallScore: 60, results: [] }).averageScore).toBe(60);
    expect(normalizeLearnerResults({ score: 90, results: [] }).averageScore).toBe(90);
  });

  it('should return an empty result set and a null averageScore for an empty/unrecognised response', () => {
    expect(normalizeLearnerResults([])).toEqual({
      scenarioResults: [],
      averageScore: null,
    });
    expect(normalizeLearnerResults({})).toEqual({
      scenarioResults: [],
      averageScore: null,
    });
  });
});
