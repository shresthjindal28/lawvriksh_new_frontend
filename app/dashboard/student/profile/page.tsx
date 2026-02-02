'use client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Profile from '@/components/user/Profile.client';
import { SkeletonLoader } from '@/components/ui/Loader';
import '@/styles/user-styles/user-profile-page.css';
export default function StudentProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="profilePage" style={{ padding: '20px' }}>
        <div className="profile-container-new" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Cover Skeleton */}
          <SkeletonLoader height="200px" style={{ borderRadius: '12px', marginBottom: '80px' }} />

          {/* Card Skeleton */}
          <div
            className="profile-card"
            style={{
              padding: '24px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #eee',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginTop: '-100px',
                marginBottom: '24px',
                position: 'relative',
                paddingLeft: '24px',
              }}
            >
              <SkeletonLoader
                height="120px"
                width="120px"
                style={{ borderRadius: '50%', border: '4px solid white', marginRight: '24px' }}
              />
              <div style={{ paddingBottom: '10px' }}>
                <SkeletonLoader height="32px" width="200px" style={{ marginBottom: '8px' }} />
                <SkeletonLoader height="16px" width="150px" />
              </div>
            </div>

            <div style={{ padding: '0 24px' }}>
              <SkeletonLoader height="24px" width="150px" style={{ marginBottom: '16px' }} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '24px',
                  marginBottom: '32px',
                }}
              >
                <SkeletonLoader height="60px" />
                <SkeletonLoader height="60px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profilePage">
      <Profile user={profile} />
    </div>
  );
}
