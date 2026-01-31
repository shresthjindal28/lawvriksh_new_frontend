import type { JSX } from 'react';
import { Copy } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { LuFacebook, LuLinkedin } from 'react-icons/lu';
import Image from 'next/image';

// Helper function to render EditorJS content
export function renderContent(content: any) {
  if (!content?.blocks) return null;

  return content.blocks.map((block: any, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p
            key={index}
            className="blog-paragraph"
            dangerouslySetInnerHTML={{ __html: block.data.text }}
          />
        );

      case 'header':
      case 'heading':
        const level = block.data.level || 2;
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        const headingId = `heading-${index}`;
        return (
          <HeadingTag
            key={index}
            id={headingId}
            className="blog-heading"
            dangerouslySetInnerHTML={{ __html: block.data.text }}
          />
        );

      case 'list':
        const isOrdered = block.data.style === 'ordered';
        const ListTag = isOrdered ? 'ol' : 'ul';
        return (
          <ListTag key={index} className="blog-list">
            {block.data.items.map((item: any, i: number) => {
              const content = typeof item === 'string' ? item : item.content;
              return (
                <li
                  key={i}
                  className="blog-list-item"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              );
            })}
          </ListTag>
        );

      case 'image':
        return (
          <figure key={index} className="blog-image-container">
            <div className="blog-image-wrapper">
              <Image
                src={block.data.file?.url || block.data.url || '/placeholder.svg'}
                alt={block.data.caption || 'Blog image'}
                fill
                className="blog-image"
              />
            </div>
            {block.data.caption && (
              <figcaption
                className="blog-image-caption"
                dangerouslySetInnerHTML={{ __html: block.data.caption }}
              />
            )}
            <div className="blog-image-actions">
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <Copy />
                </span>
                Copy Link
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <FaInstagram />
                </span>
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <LuFacebook />
                </span>
              </button>
              <button className="blog-image-action-btn">
                <span className="blog-icon">
                  <LuLinkedin />
                </span>
              </button>
            </div>
          </figure>
        );

      case 'quote':
        return (
          <blockquote key={index} className="blog-quote">
            <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
            {block.data.caption && (
              <cite dangerouslySetInnerHTML={{ __html: block.data.caption }} />
            )}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={index} className="blog-code">
            <code>{block.data.code}</code>
          </pre>
        );

      case 'delimiter':
        return <hr key={index} className="blog-delimiter" />;

      case 'table':
        return (
          <div key={index} className="blog-table-wrapper">
            <table className="blog-table">
              <tbody>
                {block.data.content?.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'embed':
        return (
          <div key={index} className="blog-embed">
            <iframe
              src={block.data.embed}
              title={block.data.caption || 'Embedded content'}
              className="blog-embed-iframe"
              allowFullScreen
            />
            {block.data.caption && <p className="blog-embed-caption">{block.data.caption}</p>}
          </div>
        );

      case 'warning':
        return (
          <div key={index} className="blog-warning">
            <strong>{block.data.title}</strong>
            <p dangerouslySetInnerHTML={{ __html: block.data.message }} />
          </div>
        );

      default:
        console.warn(`Unhandled block type: ${block.type}`, block);
        return null;
    }
  });
}
