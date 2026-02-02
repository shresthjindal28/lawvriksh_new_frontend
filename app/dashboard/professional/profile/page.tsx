'use client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Profile from '@/components/user/Profile.client';
import VideoLoader from '@/components/ui/VideoLoader';

export default function AdminProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <VideoLoader width={150} height={150} />
        <p className="text-[#6F7A8F] text-base">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="m-0 flex flex-col items-center justify-center">
      <Profile user={profile} />
    </div>
  );
}
