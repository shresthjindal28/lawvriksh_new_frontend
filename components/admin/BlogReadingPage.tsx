'use client';

import { useBlogs } from '@/hooks/common/useBlogs';
import '@/styles/admin-styles/blog-reading-page.css';
import VideoLoader from '../ui/VideoLoader';
import { ArrowRight, Copy } from 'lucide-react';
import { extractTableOfContents } from '@/lib/utils/editorHelper';
import { renderContent } from '@/lib/utils/blogHelper';
import { FaInstagram } from 'react-icons/fa';
import { LuFacebook, LuLinkedin } from 'react-icons/lu';
import Image from 'next/image';
interface BlogReadingPageProps {
  projectId: string;
}

export default function BlogReadingPageComponent({ projectId }: BlogReadingPageProps) {
  const { projectData, projectTitle, isLoading, project } = useBlogs(projectId);

  if (isLoading) {
    return (
      <div className="blog-loading-container">
        <VideoLoader width={150} height={150} />
      </div>
    );
  }

  const tableOfContents = extractTableOfContents(projectData);
  const author = project?.metadata.data.author || 'not specified';
  const featuredImage =
    project?.metadata.data.image || '/assets/images/background-image/backgroundImage.png';
  const blogTitle = projectTitle || 'Untitled Blog';

  return (
    <div className="blog-page">
      <div className="blog-container">
        {/* Blog Header */}
        <header className="blog-header">
          <h1 className="blog-title">{blogTitle}</h1>
          <div className="blog-meta">
            <span className="blog-author">by {author}</span>
          </div>
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <figure className="blog-featured-image-container">
            <div className="blog-featured-image-wrapper">
              <Image src={featuredImage} alt="Featured" fill className="blog-featured-image" />
            </div>
            <div className="blog-image-overlay">
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <Copy size={18} />
                </span>
                <span className="blog-action-text">Copy Link</span>
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <FaInstagram size={18} />
                </span>
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <LuFacebook size={18} />
                </span>
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <LuLinkedin size={18} />
                </span>
              </button>
            </div>
          </figure>
        )}

        {/* Main Content Area */}
        <div className="blog-content-wrapper">
          {/* Table of Contents Sidebar */}
          {tableOfContents.length > 0 && (
            <aside className="blog-sidebar">
              <nav className="blog-toc">
                <ul className="blog-toc-list">
                  {tableOfContents.map((item) => (
                    <li key={item.id} className={`blog-toc-item level-${item.level}`}>
                      <a href={`#${item.id}`} className="blog-toc-link">
                        {item.title}
                      </a>
                      <ArrowRight size={26} strokeWidth={1} />
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className="blog-main-content">{renderContent(projectData)}</main>
        </div>
      </div>
    </div>
  );
}
