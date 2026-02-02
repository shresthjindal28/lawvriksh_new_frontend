import { Book, BookOpen, Lock } from 'lucide-react';
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

  const getAuthorColorClass = (index: number) => {
    const colors = [
      'bg-[#c8ffce]', // Green
      'bg-[#ffeeb7]', // Yellow
      'bg-[#ffc4c4]', // Red
      'bg-[#ebcbff]', // Purple
    ];
    return colors[index % colors.length];
  };

  const getTypeLabelStyle = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-[#e3f0fb] text-[#133435]';
      case 'research_paper':
        return 'bg-[#e6f4ea] text-[#133435]';
      case 'article':
        return 'bg-[#fff9db] text-[#133435]';
      case 'draft':
        return 'bg-[#f3e8ff] text-[#133435]';
      default:
        return 'bg-[#627c7d] text-white';
    }
  };

  return (
    <article className="flex h-[160px] min-w-full md:min-w-[246px] p-[19.889px] flex-col justify-center items-start gap-[11px] flex-1 rounded-[7px] border border-[rgba(19,52,53,0.08)] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_6px_0_rgba(0,0,0,0.1)] sm:h-auto sm:min-h-[160px]">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-2 self-stretch">
        <h2 className="text-[#000] font-[family-name:var(--font-playfair),serif] text-[18px] font-normal leading-[26px] m-0 flex-1">
          {truncateText(title, 20)}
        </h2>
        {access_type === Privacy.PRIVATE && (
          <Lock className="w-[1.1rem] h-[1.1rem] text-[#133435] shrink-0 mt-[0.125rem] opacity-80" />
        )}
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-[rgba(19,52,53,0.08)] self-stretch" />

      {/* Dynamic Content Section */}
      <div className="flex flex-col gap-2 flex-1 self-stretch">
        {showAuthors && authors.length > 0 && (
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center gap-[6px] px-[10px] py-[2px] bg-[#f3f4f6] text-[#133435] rounded-full font-[family-name:var(--font-instrument-sans),sans-serif] text-[12px] font-medium whitespace-nowrap w-fit transition-colors duration-200">
              <span className="text-[12px]">
                <BookOpen size={18} />
              </span>
              <span>Author and Co-Author:</span>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {authors.map((author, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-[10px] py-[2px] ${getAuthorColorClass(index)} text-[#133435] rounded-full font-[family-name:var(--font-instrument-sans),sans-serif] text-[10px] font-medium whitespace-nowrap transition-colors duration-200 hover:bg-[#133435] hover:text-white`}
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}

        {type === 'assignment' && subject && (
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center gap-[6px] px-[10px] py-[2px] bg-[#f3f4f6] text-[#133435] rounded-full font-[family-name:var(--font-instrument-sans),sans-serif] text-[12px] font-medium whitespace-nowrap w-fit transition-colors duration-200">
              <span className="text-[12px]">
                <BookOpen size={18} />
              </span>
              <span>Subject: {subject}</span>
            </div>
          </div>
        )}

        {type === 'ideation' && (
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center gap-[6px] px-[10px] py-[2px] bg-[#f3f4f6] text-[#133435] rounded-full font-[family-name:var(--font-instrument-sans),sans-serif] text-[12px] font-medium whitespace-nowrap w-fit transition-colors duration-200">
              <span className="text-[12px]">
                <BookOpen size={18} />
              </span>
              <span>Subject: {'Ideation'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="flex pt-3 justify-between items-center self-stretch border-t border-[#f3f4f6] sm:flex-col sm:items-start sm:gap-2">
        <span
          className={`flex h-[18px] px-[12.889px] py-[2.445px] pb-[3.555px] items-center rounded-[20px] border border-[rgba(0,0,0,0.05)] font-[family-name:var(--font-instrument-sans),sans-serif] text-[10px] font-normal leading-[10px] capitalize ${getTypeLabelStyle(type)}`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
        </span>
        <span className="text-[#656565] font-[family-name:var(--font-instrument-sans),sans-serif] text-[10px] font-normal leading-[10px]">
          {new Date(lastEdited).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
