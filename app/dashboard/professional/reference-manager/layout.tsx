import ReferenceManager from '@/components/reference-manager/client/layout/ReferenceManager';
import { ReferenceProvider } from '@/lib/contexts/reference/ReferenceProvider';

export default function ReferenceManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReferenceProvider>
      <ReferenceManager />
      <div style={{ display: 'none' }}>{children}</div>
    </ReferenceProvider>
  );
}
