'use client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Profile from '@/components/user/Profile.client';
import '@/styles/user-styles/user-profile-page.css';
import VideoLoader from '@/components/ui/VideoLoader';

export default function ProfessionalProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="profilePage">
      <Profile user={profile} />
    </div>
  );
}
