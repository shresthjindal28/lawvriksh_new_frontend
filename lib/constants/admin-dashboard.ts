export const LOCALE_CONFIG = {
  locale: 'en-IN',
  timeZone: 'Asia/Kolkata',
} as const;

export const ACTION_CATEGORIES = {
  SYSTEM: 'System',
  ALERT: 'Alert',
  SECURITY: 'Security',
} as const;

export const STAT_LABELS = {
  PENDING_APPLICATIONS: 'Pending Applications',
  APPROVALS_VS_REJECTIONS: 'Approvals vs. Rejections',
  ACTIVE_SESSIONS: 'Active Sessions',
  TOTAL_USERS: 'Total Users',
} as const;
