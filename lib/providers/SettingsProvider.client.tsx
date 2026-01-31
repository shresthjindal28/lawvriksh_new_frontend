'use client';

import { SettingsProvider } from '@/lib/contexts/SettingsContext';

interface SettingsProviderWrapperProps {
  children: React.ReactNode;
}

export default function SettingsProviderWrapper({ children }: SettingsProviderWrapperProps) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
