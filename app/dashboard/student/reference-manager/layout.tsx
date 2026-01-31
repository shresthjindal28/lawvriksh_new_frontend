import ReferenceManager from '@/components/reference-manager/client/layout/ReferenceManager';
import { ReferenceProvider } from '@/lib/contexts/reference/ReferenceProvider';

export default function ReferenceManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReferenceProvider>
      <ReferenceManager />
      {/* 
                We render children but hide them because ReferenceManager handles the entire UI.
                The children (page.tsx components) are kept as empty/null placeholders 
                to satisfy Next.js routing requirements.
            */}
      <div style={{ display: 'none' }}>{children}</div>
    </ReferenceProvider>
  );
}
