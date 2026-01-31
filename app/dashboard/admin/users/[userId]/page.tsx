import React from 'react';
import '@/styles/admin-styles/user-details.css';
import '@/styles/admin-styles/modal.css';
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
