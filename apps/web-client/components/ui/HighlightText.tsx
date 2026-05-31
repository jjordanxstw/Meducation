import { Fragment } from 'react';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders `text` with every case-insensitive occurrence of `query` wrapped in
 * a highlighted <mark>. Falls back to plain text when there is no query.
 */
export function HighlightText({
  text,
  query,
  className = '',
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'));
  const lowerQuery = trimmed.toLowerCase();

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerQuery ? (
          <mark key={index} className="rounded bg-brand/15 px-0.5 text-brand">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
