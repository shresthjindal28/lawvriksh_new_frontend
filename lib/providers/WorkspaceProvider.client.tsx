'use client';
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext';

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProviderClient({ children }: WorkspaceProviderProps) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
