'use client';
import { ReferenceProvider } from '@/lib/contexts/reference/ReferenceProvider';
import { AuthProviderClient } from '@/lib/providers/AuthProvider.client';

interface ReferenceProviderProps {
  children: React.ReactNode;
}

export function ReferenceProviderClient({ children }: ReferenceProviderProps) {
  return (
    <AuthProviderClient>
      <ReferenceProvider>{children}</ReferenceProvider>
    </AuthProviderClient>
  );
}
