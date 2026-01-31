'use client';

import { useState } from 'react';
import Home from '@/components/dashboard/home/Home';
import { ProjectCreationOptions } from '@/lib/config/projectConfig';

// Data
const categories = ProjectCreationOptions.map((option) => ({
  id: option.id,
  name: option.name,
  icon: option.name, // Using name instead of icon since Icon is a React component
}));

export default function StudentDashboardPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Home categories={categories} role="student" />
    </div>
  );
}
