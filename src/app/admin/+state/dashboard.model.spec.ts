import { normalizeTrainerDashboardStats } from './dashboard.model';

describe('normalizeTrainerDashboardStats', () => {
  it('maps a fully-populated overview and a flat activity array', () => {
    const stats = normalizeTrainerDashboardStats(
      {
        totalLearners: 52,
        activeModules: 8,
        completionRate: 78,
        averageScore: 81,
        moduleCompletion: [
          { moduleId: 1, moduleName: 'Email Phishing Basics', completionPercentage: 50 },
        ],
      },
      [
        {
          id: 1,
          userName: 'Joseph Smith',
          action: 'Completed Email Phishing Basics',
          status: 'completed',
          timestamp: '2 hours ago',
          moduleName: 'Email Phishing Basics',
        },
      ],
    );

    expect(stats).toEqual({
      totalLearners: 52,
      activeModules: 8,
      completionRate: 78,
      averageScore: 81,
      moduleCompletion: [
        { moduleId: 1, moduleName: 'Email Phishing Basics', completionPercentage: 50 },
      ],
      recentActivity: [
        {
          id: '1',
          userName: 'Joseph Smith',
          action: 'Completed Email Phishing Basics',
          status: 'completed',
          timestamp: '2 hours ago',
          moduleName: 'Email Phishing Basics',
        },
      ],
    });
  });

  it('falls back through alternate field names for the headline stats', () => {
    const stats = normalizeTrainerDashboardStats(
      { learnerCount: 10, moduleCount: 3, averageCompletionRate: 60, avgScore: 72 },
      [],
    );

    expect(stats.totalLearners).toBe(10);
    expect(stats.activeModules).toBe(3);
    expect(stats.completionRate).toBe(60);
    expect(stats.averageScore).toBe(72);
  });

  it('unwraps an activity response wrapped in { activities: [...] } or { items: [...] }', () => {
    const wrappedInActivities = normalizeTrainerDashboardStats(
      {},
      { activities: [{ userName: 'Ava' }] },
    );
    const wrappedInItems = normalizeTrainerDashboardStats({}, { items: [{ userName: 'Noah' }] });

    expect(wrappedInActivities.recentActivity[0].userName).toBe('Ava');
    expect(wrappedInItems.recentActivity[0].userName).toBe('Noah');
  });

  it('maps a module completion list using alternate field names', () => {
    const stats = normalizeTrainerDashboardStats(
      { modules: [{ id: 2, title: 'SMS Phishing Basics', completionRate: 28 }] },
      [],
    );

    expect(stats.moduleCompletion).toEqual([
      { moduleId: 2, moduleName: 'SMS Phishing Basics', completionPercentage: 28 },
    ]);
  });

  it('normalizes varied activity status casings to the known ActivityStatus values', () => {
    const stats = normalizeTrainerDashboardStats(
      {},
      [
        { status: 'COMPLETED' },
        { status: 'in-progress' },
        { status: 'FAILED' },
        { status: 'something-unrecognised' },
      ],
    );

    expect(stats.recentActivity.map((item) => item.status)).toEqual([
      'completed',
      'started',
      'failed',
      'started',
    ]);
  });

  it('defaults to empty lists and zeroed stats when nothing is provided', () => {
    const stats = normalizeTrainerDashboardStats({}, {});

    expect(stats).toEqual({
      totalLearners: 0,
      activeModules: 0,
      completionRate: 0,
      averageScore: 0,
      moduleCompletion: [],
      recentActivity: [],
    });
  });
});
