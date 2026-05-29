/**
 * SafeHtml (6.3)
 *
 * Single, consistent place to render user-generated HTML (announcement content,
 * lecture descriptions). All such rendering MUST go through this component so
 * the DOMPurify sanitization cannot be forgotten. Raw dangerouslySetInnerHTML
 * elsewhere is flagged by ESLint (eslint-plugin-no-unsanitized).
 */
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
  /** Additional tags to allow beyond DOMPurify defaults. */
  allowedTags?: string[];
}

export function SafeHtml({ html, className, allowedTags }: SafeHtmlProps) {
  const sanitized = useMemo(() => {
    const config = allowedTags ? { ADD_TAGS: allowedTags } : undefined;
    return DOMPurify.sanitize(html ?? '', config);
  }, [html, allowedTags]);

  // Content is sanitized with DOMPurify above before being injected.
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

export default SafeHtml;
