'use client';
import { AuthProvider } from '@/lib/contexts/AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProviderClient({ children }: AuthProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
