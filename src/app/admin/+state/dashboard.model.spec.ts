import { normalizeTrainerDashboardStats } from './dashboard.model';

describe('normalizeTrainerDashboardStats', () => {
  const overview = {
    totalLearners: 52,
    activeModules: 8,
    overallCompletionRate: 78,
    averageScore: 81,
    moduleCompletion: [
      { moduleId: 4, moduleName: 'Spotting Phishing Emails', completionPercentage: 62 },
    ],
  };

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-22T14:14:00.000Z'));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('maps the headline stats straight from DashboardOverviewDto', () => {
    const stats = normalizeTrainerDashboardStats(overview, { activity: [] });

    expect(stats.totalLearners).toBe(52);
    expect(stats.activeModules).toBe(8);
    expect(stats.completionRate).toBe(78);
    expect(stats.averageScore).toBe(81);
  });

  it('maps the per-module completion breakdown straight from DashboardOverviewDto', () => {
    const stats = normalizeTrainerDashboardStats(overview, { activity: [] });

    expect(stats.moduleCompletion).toEqual([
      { moduleId: 4, moduleName: 'Spotting Phishing Emails', completionPercentage: 62 },
    ]);
  });

  it('returns an empty moduleCompletion list when the organisation has no modules', () => {
    const stats = normalizeTrainerDashboardStats(
      { ...overview, moduleCompletion: [] },
      { activity: [] },
    );

    expect(stats.moduleCompletion).toEqual([]);
  });

  it('maps a completed activity item to its display fields', () => {
    const stats = normalizeTrainerDashboardStats(overview, {
      activity: [
        {
          userId: 12,
          username: 'jane.doe',
          firstName: 'Jane',
          lastName: 'Doe',
          moduleId: 4,
          moduleTitle: 'Spotting Phishing Emails',
          action: 'completed',
          timestamp: '2026-08-22T12:14:00.000Z',
        },
      ],
    });

    expect(stats.recentActivity).toEqual([
      {
        id: '12-4-2026-08-22T12:14:00.000Z',
        userName: 'Jane Doe',
        action: 'Completed Spotting Phishing Emails',
        status: 'completed',
        timestamp: '2 hours ago',
        moduleName: 'Spotting Phishing Emails',
      },
    ]);
  });

  it('maps "started" and "assigned" actions to their labels and statuses', () => {
    const stats = normalizeTrainerDashboardStats(overview, {
      activity: [
        {
          userId: 1,
          username: 'a',
          firstName: 'Ava',
          lastName: 'Smith',
          moduleId: 1,
          moduleTitle: 'Module A',
          action: 'started',
          timestamp: '2026-08-22T14:04:00.000Z',
        },
        {
          userId: 2,
          username: 'b',
          firstName: 'Ben',
          lastName: 'Jones',
          moduleId: 2,
          moduleTitle: 'Module B',
          action: 'assigned',
          timestamp: '2026-08-22T14:14:00.000Z',
        },
      ],
    });

    expect(stats.recentActivity[0].action).toBe('Started Module A');
    expect(stats.recentActivity[0].status).toBe('started');
    expect(stats.recentActivity[1].action).toBe('Assigned Module B');
    // ActivityStatus has no "assigned" state - falls back to "started".
    expect(stats.recentActivity[1].status).toBe('started');
  });

  it('formats the activity timestamp as a relative time string', () => {
    const stats = normalizeTrainerDashboardStats(overview, {
      activity: [
        {
          userId: 1, username: 'a', firstName: 'Ava', lastName: 'Smith',
          moduleId: 1, moduleTitle: 'Module A', action: 'completed',
          timestamp: '2026-08-22T14:13:30.000Z',
        },
        {
          userId: 2, username: 'b', firstName: 'Ben', lastName: 'Jones',
          moduleId: 2, moduleTitle: 'Module B', action: 'completed',
          timestamp: '2026-08-21T14:14:00.000Z',
        },
        {
          userId: 3, username: 'c', firstName: 'Cara', lastName: 'Lee',
          moduleId: 3, moduleTitle: 'Module C', action: 'completed',
          timestamp: '2026-08-19T14:14:00.000Z',
        },
      ],
    });

    expect(stats.recentActivity[0].timestamp).toBe('Just now');
    expect(stats.recentActivity[1].timestamp).toBe('Yesterday');
    expect(stats.recentActivity[2].timestamp).toBe('3 days ago');
  });

  it('maps every activity item in the list, in order', () => {
    const stats = normalizeTrainerDashboardStats(overview, {
      activity: [
        {
          userId: 1, username: 'a', firstName: 'Ava', lastName: 'Smith',
          moduleId: 1, moduleTitle: 'Module A', action: 'completed',
          timestamp: '2026-08-22T14:14:00.000Z',
        },
        {
          userId: 2, username: 'b', firstName: 'Ben', lastName: 'Jones',
          moduleId: 2, moduleTitle: 'Module B', action: 'started',
          timestamp: '2026-08-22T14:14:00.000Z',
        },
      ],
    });

    expect(stats.recentActivity.length).toBe(2);
    expect(stats.recentActivity[0].userName).toBe('Ava Smith');
    expect(stats.recentActivity[1].userName).toBe('Ben Jones');
  });
});
