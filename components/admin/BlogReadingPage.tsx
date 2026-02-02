'use client';

import { useBlogs } from '@/hooks/common/useBlogs';
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
    <>
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

      <style jsx>{`
        /* ===== PAGE CONTAINER ===== */
        .blog-page {
          background-color: white;
          min-height: 100vh;
        }

        .blog-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }

        /* ===== BLOG HEADER ===== */
        .blog-header {
          margin-bottom: 2rem;
        }

        .blog-title {
          font-size: 2.8rem;
          font-weight: 500;
          line-height: 1.2;
          color: #000;
          margin: 0 0 1rem 0;
          font-family: 'Playfair Display', serif;
          letter-spacing: -0.01em;
        }

        .blog-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .blog-author {
          color: #374151;
          font-weight: 500;
          text-decoration: underline;
          font-family: 'source sans pro', sans-serif;
          border-top: 1px solid #d4af37;
          padding-top: 1rem;
        }

        /* ===== FEATURED IMAGE ===== */
        .blog-featured-image-container {
          position: relative;
          margin-bottom: 3rem;
          margin: 0;
          overflow: hidden;
          background-color: #f3f4f6;
        }

        .blog-featured-image {
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }

        .blog-image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          justify-content: flex-end;
          align-items: center;
        }

        /* ===== CONTENT WRAPPER ===== */
        .blog-content-wrapper {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 3rem;
          margin-top: 3rem;
        }

        /* ===== SIDEBAR / TABLE OF CONTENTS ===== */
        .blog-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .blog-toc {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .blog-toc-title {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0;
          letter-spacing: 0.05em;
        }

        .blog-toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .blog-toc-item {
          font-size: 0.875rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #000;
          border-bottom: 1px solid #000;
          font-weight: 600;
        }

        .blog-toc-item.level-2 {
          margin-left: 0;
        }

        .blog-toc-item.level-3 {
          font-size: 0.875rem;
          color: #000;
        }

        .blog-toc-item.level-4 {
          margin-left: 2rem;
          font-size: 0.75rem;
          color: #000;
        }

        .blog-toc-link {
          text-decoration: none;
          color: #000;
          display: block;
          line-height: 1.5;
          width: fit-content;
          font-family: 'Playfair Display', serif;
          font-weight: 500;
          font-size: 1rem;
        }

        /* ===== MAIN CONTENT ===== */
        .blog-main-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Playfair Display', serif;
        }

        .blog-heading {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          line-height: 1.3;
          color: #000;
          margin: 2rem 0 1rem 0;
        }

        .blog-heading:first-child {
          margin-top: 0;
        }

        .blog-heading h2 {
          font-size: 1.75rem;
        }

        .blog-heading h3 {
          font-size: 1.375rem;
        }

        .blog-heading h4 {
          font-size: 1.125rem;
        }

        .blog-paragraph {
          font-size: 1rem;
          line-height: 1.7;
          color: #4b5563;
          margin: 0;
          font-family: 'Verdana', sans-serif;
        }

        .blog-list {
          list-style: disc;
          margin: 1rem 0;
          padding-left: 2rem;
          color: #4b5563;
          font-size: 1rem;
          line-height: 1.7;
        }

        .blog-list-item {
          margin-bottom: 0.75rem;
        }

        .blog-image-container {
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .blog-image {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          display: block;
        }

        .blog-image-caption {
          font-size: 0.875rem;
          color: #9ca3af;
          margin: 0;
          font-style: italic;
        }

        .blog-image-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: flex-start;
        }

        .blog-image-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid white;
          background-color: transparent;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'source sans pro', sans-serif;
        }

        .blog-image-action-btn:hover {
          background-color: #d4af37;
          border-color: #d4af37;
        }

        .blog-action-text {
          font-size: 0.95rem;
        }

        .blog-icon {
          display: inline-block;
          font-size: 1rem;
        }

        .blog-loading-container,
        .blog-error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-size: 1rem;
          color: #374151;
        }

        .blog-error-container {
          color: #dc2626;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .blog-title {
            font-size: 2rem;
          }

          .blog-content-wrapper {
            grid-template-columns: 150px 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 768px) {
          .blog-container {
            padding: 2rem 1rem;
          }

          .blog-title {
            font-size: 1.5rem;
          }

          .blog-content-wrapper {
            grid-template-columns: 1fr;
          }

          .blog-sidebar {
            position: static;
          }

          .blog-toc-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
          }

          .blog-heading h2 {
            font-size: 1.375rem;
          }
        }

        @media (max-width: 640px) {
          .blog-header {
            margin-bottom: 1.5rem;
          }

          .blog-title {
            font-size: 1.25rem;
          }

          .blog-container {
            padding: 1.5rem 1rem;
          }

          .blog-paragraph {
            font-size: 0.9375rem;
          }
        }
      `}</style>
    </>
  );
}
