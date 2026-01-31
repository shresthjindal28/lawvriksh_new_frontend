import { GetProjectContent } from '@/types/project';
import { formatTimeAgo } from '@/lib/utils/helpers';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { HamburgerButton } from './HamburgerButton';

interface TitleHedaerProps {
  projectTitle: string;
  project: GetProjectContent | null;
}
export default function TitleHeader({ projectTitle, project }: TitleHedaerProps) {
  return (
    <div className="page-header-default sticky-header">
      <div className="header-content header-content-default topbar-default-layout">
        <div className="topbar-left">
          <HamburgerButton className="md:hidden" />
          <div className="topbar-brand">
            <Link
              href="/dashboard"
              className="topbar-brand"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="topbar-title">{projectTitle || 'Untitled Document'}</h1>
          </div>
        </div>
        {/* {toolbar && <div className="topbar-toolbar-slot">{toolbar}</div>} */}
        <div className="topbar-right">
          <div className="topbar-brand">
            <p className="topbar-save-text">
              Edited {project?.updated_at ? formatTimeAgo(project.updated_at) : 'just now'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
