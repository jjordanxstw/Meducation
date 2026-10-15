/**
 * Tiny Markdown → HTML for the editor's Preview tab (headings, bold, italic,
 * links, lists, quotes, paragraphs). Input is HTML-escaped first and the result
 * still goes through SafeHtml/DOMPurify. The student site renders the real
 * thing with react-markdown; this only needs to be close.
 */
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text: string): string {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function miniMarkdown(source: string): string {
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (heading) {
      flush();
      const level = heading[1].length + 1;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (paragraph.length || list !== kind) flush();
      if (!list) {
        list = kind;
        out.push(`<${kind}>`);
      }
      out.push(`<li>${inline((bullet ?? numbered)![1])}</li>`);
    } else if (quote) {
      flush();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
    } else if (!line.trim()) {
      flush();
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return out.join('\n');
}
