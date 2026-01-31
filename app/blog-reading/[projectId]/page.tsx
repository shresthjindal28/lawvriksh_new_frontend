import React from 'react';
import BlogReadingPageComponent from '@/components/admin/BlogReadingPage';

interface BlogReadingPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function BlogReadingPage({ params }: BlogReadingPageProps) {
  const { projectId } = await params;
  return <BlogReadingPageComponent projectId={projectId} />;
}
