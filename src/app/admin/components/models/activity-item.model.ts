export type ActivityStatus = 'completed' | 'started' | 'failed';

export interface ActivityItem {
  id?: string;

  userName: string;

  action: string;
  // e.g. "Email Phishing Basics"

  status: ActivityStatus;
  // determines icon/color

  timestamp: string;
  // e.g. "2 hours ago"

  moduleName?: string;
  // optional if you want to separate
  // "Completed" + "Email Phishing Basics"

  avatarUrl?: string;

  route?: string;
  // optional if clicking item navigates somewhere
}
