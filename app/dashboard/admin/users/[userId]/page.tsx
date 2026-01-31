import React from 'react';
import UserDetailsComp from '@/components/admin/UserDetail';

interface UserDetailsPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { userId } = await params;
  return <UserDetailsComp userId={userId} />;
}
