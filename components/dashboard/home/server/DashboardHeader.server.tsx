/**
 * DashboardHeader.server.tsx
 *
 * Server Component - renders welcome message and date.
 * No JavaScript shipped to client for this component.
 *
 * Note: Date is formatted on server. For real-time updates,
 * a client component wrapper can be added later if needed.
 */

interface DashboardHeaderProps {
  userName: string;
  /** Pre-formatted date string to avoid hydration mismatch */
  formattedDate?: string;
  /** Pre-formatted time string to avoid hydration mismatch */
  formattedTime?: string;
}

export default function DashboardHeader({
  userName,
  formattedDate,
  formattedTime,
}: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-welcome-container">
        <h2 className="dashboard-welcome-title">Welcome back, {userName}</h2>
        <p className="dashboard-welcome-subtitle">
          {formattedDate} • {formattedTime}
        </p>
      </div>
    </div>
  );
}
