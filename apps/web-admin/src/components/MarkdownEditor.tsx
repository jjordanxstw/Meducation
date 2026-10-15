/**
 * Markdown body field with a small formatting toolbar and Write / Preview tabs
 * (Brilliant: 04 Admin — News editor).
 */
import { forwardRef, useRef, useState } from 'react';
import { Bold, Heading2, Italic, Link2, List, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { miniMarkdown } from '@/lib/mini-markdown';
import { Segmented } from '@/components/ui/segmented';
import { SafeHtml } from './SafeHtml';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  'aria-invalid'?: boolean;
};

const TOOLS = [
  { label: 'Bold', icon: Bold, wrap: ['**', '**'], fallback: 'bold text' },
  { label: 'Italic', icon: Italic, wrap: ['*', '*'], fallback: 'italic text' },
  { label: 'Heading', icon: Heading2, prefix: '## ', fallback: 'Heading' },
  { label: 'Bulleted list', icon: List, prefix: '- ', fallback: 'List item' },
  { label: 'Link', icon: Link2, wrap: ['[', '](https://)'], fallback: 'link text' },
  { label: 'Quote', icon: Quote, prefix: '> ', fallback: 'Quote' },
] as const;

export const MarkdownEditor = forwardRef<HTMLTextAreaElement, Props>(function MarkdownEditor(
  { value, onChange, onBlur, placeholder, rows = 14, 'aria-invalid': invalid },
  ref,
) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const local = useRef<HTMLTextAreaElement | null>(null);

  const apply = (tool: (typeof TOOLS)[number]) => {
    const area = local.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    const selected = value.slice(start, end) || tool.fallback;
    if ('prefix' in tool) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const next = `${value.slice(0, lineStart)}${tool.prefix}${value.slice(lineStart, start)}${selected}${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => area.focus());
      return;
    }
    const insert = `${tool.wrap[0]}${selected}${tool.wrap[1]}`;
    onChange(`${value.slice(0, start)}${insert}${value.slice(end)}`);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + tool.wrap[0].length, start + tool.wrap[0].length + selected.length);
    });
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-white', invalid ? 'border-red-400' : 'border-slate-200')}>
      <div className="flex items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 px-2 py-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => apply(tool)}
            disabled={mode === 'preview'}
            aria-label={tool.label}
            title={tool.label}
            className="flex size-7 items-center justify-center rounded text-ink-3 hover:bg-white hover:text-ink-1 disabled:opacity-40"
          >
            <tool.icon className="size-3.5" />
          </button>
        ))}
        <span className="ml-1 text-[11px] text-ink-4">Markdown</span>
        <span className="flex-1" />
        <Segmented
          aria-label="Editor mode"
          value={mode}
          onChange={setMode}
          options={[
            { label: 'Write', value: 'write' },
            { label: 'Preview', value: 'preview' },
          ]}
        />
      </div>
      {mode === 'write' ? (
        <textarea
          ref={(node) => {
            local.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={invalid}
          className="block w-full resize-y bg-white px-3 py-2.5 text-[13px] leading-relaxed text-ink-1 outline-none placeholder:text-ink-4"
        />
      ) : (
        <SafeHtml
          html={miniMarkdown(value) || '<p class="text-ink-3">Nothing to preview yet.</p>'}
          className="prose-admin min-h-[12rem] px-4 py-3 text-[13px] leading-relaxed text-ink-1"
        />
      )}
    </div>
  );
});
