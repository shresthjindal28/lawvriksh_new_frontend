import { ACTION_CATEGORIES, STAT_LABELS } from '@/lib/constants/admin-dashboard';
import { calculatePercentage, getCurrentTimestamp } from '@/lib/utils/helpers';

interface AdminInfo {
  admin_id: string;
  admin_name: string;
  admin_email: string;
  role: string;
  last_login: string;
  dashboard_generated_at: string;
}

interface StatItem {
  label: string;
  value?: number;
  split?: {
    main: string;
    sub: string;
  };
}

interface ActionItem {
  user: string;
  action: string;
  timestamp: string;
}

interface DashboardData {
  admin_info: {
    admin_id: string;
    admin_name: string;
    admin_email: string;
    last_login: string;
    dashboard_generated_at: string;
  };
  creator_overview: {
    pending_applications: number;
    applications_today: number;
  };
  user_overview: {
    new_users_today: number;
  };
  system_overview: {
    active_sessions: number;
  };
  recent_activities: {
    flagged_applications: any[];
    high_risk_users: any[];
  };
  priority_alerts?: Array<{ message?: string }>;
}

interface SystemStats {
  user_stats: {
    total_users: number;
  };
  application_stats: {
    approved_applications: number;
    rejected_applications: number;
  };
}

class AdminInfoTransformer {
  static transform(dashboardData: DashboardData | null): AdminInfo | null {
    if (!dashboardData) return null;

    return {
      admin_id: dashboardData.admin_info.admin_id,
      admin_name: dashboardData.admin_info.admin_name,
      admin_email: dashboardData.admin_info.admin_email,
      role: 'Admin',
      last_login: dashboardData.admin_info.last_login,
      dashboard_generated_at: dashboardData.admin_info.dashboard_generated_at,
    };
  }
}

//Builds statistics for the dashboard
class StatsBuilder {
  private stats: StatItem[] = [];

  addPendingApplications(count: number): this {
    this.stats.push({
      label: STAT_LABELS.PENDING_APPLICATIONS,
      value: count,
    });
    return this;
  }

  addApprovalRejectionSplit(approved: number, rejected: number): this {
    const total = approved + rejected;
    const approvalPercent = calculatePercentage(approved, total);

    this.stats.push({
      label: STAT_LABELS.APPROVALS_VS_REJECTIONS,
      split: {
        main: `${approvalPercent}%`,
        sub: `${100 - approvalPercent}%`,
      },
    });
    return this;
  }

  addActiveSessions(count: number): this {
    this.stats.push({
      label: STAT_LABELS.ACTIVE_SESSIONS,
      value: count,
    });
    return this;
  }

  addTotalUsers(count: number): this {
    this.stats.push({
      label: STAT_LABELS.TOTAL_USERS,
      value: count,
    });
    return this;
  }

  build(): StatItem[] {
    return this.stats;
  }

  static fromDashboardData(
    dashboardData: DashboardData | null,
    systemStats: SystemStats | null
  ): StatItem[] {
    if (!dashboardData || !systemStats) return [];

    return new StatsBuilder()
      .addPendingApplications(dashboardData.creator_overview.pending_applications)
      .addApprovalRejectionSplit(
        systemStats.application_stats.approved_applications,
        systemStats.application_stats.rejected_applications
      )
      .addActiveSessions(dashboardData.system_overview.active_sessions)
      .addTotalUsers(systemStats.user_stats.total_users)
      .build();
  }
}

//Builds action items for the dashboard
class ActionsBuilder {
  private actions: ActionItem[] = [];
  private timestamp: string;

  constructor() {
    this.timestamp = getCurrentTimestamp();
  }

  addSystemAction(action: string): this {
    this.actions.push({
      user: ACTION_CATEGORIES.SYSTEM,
      action,
      timestamp: this.timestamp,
    });
    return this;
  }

  addAlertAction(action: string): this {
    this.actions.push({
      user: ACTION_CATEGORIES.ALERT,
      action,
      timestamp: this.timestamp,
    });
    return this;
  }

  addSecurityAction(action: string): this {
    this.actions.push({
      user: ACTION_CATEGORIES.SECURITY,
      action,
      timestamp: this.timestamp,
    });
    return this;
  }

  build(): ActionItem[] {
    return this.actions;
  }

  static fromDashboardData(dashboardData: DashboardData | null): ActionItem[] {
    if (!dashboardData) return [];

    const builder = new ActionsBuilder();

    // Add base system actions
    builder
      .addSystemAction(`New users today: ${dashboardData.user_overview.new_users_today}`)
      .addSystemAction(`Applications today: ${dashboardData.creator_overview.applications_today}`)
      .addSystemAction(`Active sessions: ${dashboardData.system_overview.active_sessions}`);

    // Add priority alerts
    if (dashboardData.priority_alerts && dashboardData.priority_alerts.length > 0) {
      dashboardData.priority_alerts.forEach((alert, index) => {
        builder.addAlertAction(alert.message || `Priority Alert ${index + 1}`);
      });
    }

    // Add security-related actions
    const { flagged_applications, high_risk_users } = dashboardData.recent_activities;

    if (flagged_applications.length > 0) {
      builder.addSecurityAction(`Flagged applications: ${flagged_applications.length}`);
    }

    if (high_risk_users.length > 0) {
      builder.addSecurityAction(`High risk users detected: ${high_risk_users.length}`);
    }

    return builder.build();
  }
}

export { AdminInfoTransformer, StatsBuilder, ActionsBuilder };
