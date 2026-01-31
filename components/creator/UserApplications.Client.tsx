import { CreatorApplication } from '@/types/creator';
import '../../styles/creator-styles/my-applications.css';

interface UserApplicationsCompProps {
  userApplications: CreatorApplication[];
}

export default function UserApplications({ userApplications }: UserApplicationsCompProps) {
  if (!userApplications || userApplications.length === 0) {
    return (
      <div className="applications-container">
        <h1 className="applications-header">My Applications</h1>
        <div className="no-applications">
          <p>You have not submitted any applications yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <h1 className="applications-header">My Applications</h1>
      <div className="applications-list">
        {userApplications.map((app) => (
          <div key={app.id} className="application-card">
            <div className="card-header">
              <h2 className="card-title">
                {app.category || 'Creator'} Application
                <span>({app.user_username || 'N/A'})</span>
              </h2>
              <span className="card-status">{app.status}</span>
            </div>
            <div className="card-body">
              <p className="detail-item">
                <strong>Applied On</strong>
                {new Date(app.applied_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="detail-item">
                <strong>Reviewed On</strong>
                {app.reviewed_at
                  ? new Date(app.reviewed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not Reviewed Yet'}
              </p>
              <p className="detail-item">
                <strong>Application ID</strong>
                {app.id}
              </p>
              <p className="detail-item full-width">
                <strong>Review Notes</strong>
                {app.review_notes || 'No notes available.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
