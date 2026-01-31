import { Book, BookOpen, Lock } from 'lucide-react';
import '@/styles/dashboard-styles/student-project-card.css';
import { DocumentType } from '@/types/project';
import { Privacy } from '@/types/workspace';
import { truncateText } from '@/lib/utils/helpers';

interface ProjectCardProps {
  title: string;
  type: DocumentType;
  lastEdited: string;
  access_type?: Privacy;
  authors?: string[];
  subject?: string;
}

export default function StudentProjectCard({
  title,
  type,
  lastEdited,
  access_type = Privacy.PRIVATE,
  authors = [],
  subject = '',
}: ProjectCardProps) {
  const showAuthors = type === 'research_paper' || type === 'article';

  const getAuthorColor = (index: number) => {
    const colors = [
      'author-badge-green',
      'author-badge-yellow',
      'author-badge-red',
      'author-badge-purple',
    ];
    return colors[index % colors.length];
  };

  return (
    <article className="project-card">
      {/* Header Section */}
      <div className="project-card-header">
        <h2 className="project-title">{truncateText(title, 20)}</h2>
        {access_type === Privacy.PRIVATE && <Lock className="lock-icon" />}
      </div>

      {/* Divider */}
      <div className="project-divider" />

      {/* Dynamic Content Section */}
      <div className="project-content">
        {showAuthors && authors.length > 0 && (
          <div className="privacy-section">
            <div className="privacy-text">
              <span className="authors-icon">
                <BookOpen size={18} />
              </span>
              <span>Author and Co-Author:</span>
            </div>
            <div className="authors-list">
              {authors.map((author, index) => (
                <span key={index} className={`author-badge ${getAuthorColor(index)}`}>
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}

        {type === 'assignment' && subject && (
          <div className="privacy-section">
            <div className="privacy-text">
              <span className="subject-icon">
                <BookOpen size={18} />
              </span>
              <span>Subject: {subject}</span>
            </div>
          </div>
        )}

        {type === 'ideation' && (
          <div className="privacy-section">
            <div className="privacy-text">
              <span className="subject-icon">
                <BookOpen size={18} />
              </span>
              <span>Subject: {'Ideation'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="project-footer">
        <span
          className={`footer-label ${
            type == 'assignment'
              ? 'footer-label-assignment'
              : type == 'research_paper'
                ? 'footer-label-research-paper'
                : type == 'draft'
                  ? 'footer-label-draft'
                  : 'footer-label-article'
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
        </span>
        <span className="last-edited">{new Date(lastEdited).toLocaleDateString()}</span>
      </div>
    </article>
  );
}
