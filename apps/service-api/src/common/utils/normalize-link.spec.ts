import { normalizeLink } from './normalize-link';

describe('normalizeLink', () => {
  it('treats every YouTube URL shape for one video as the same link', () => {
    const variants = [
      'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      'https://youtu.be/aqz-KE-bpKQ?t=30',
      'https://www.youtube.com/embed/aqz-KE-bpKQ',
      ' https://m.youtube.com/watch?v=aqz-KE-bpKQ&list=PL1 ',
    ];
    expect(new Set(variants.map(normalizeLink))).toEqual(new Set(['youtube:aqz-KE-bpKQ']));
  });

  it('compares Google Drive files by file id', () => {
    expect(normalizeLink('https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing')).toBe(
      normalizeLink('https://drive.google.com/file/d/1AbCdEfGhIjK/preview'),
    );
  });

  it('ignores case, query strings and trailing slashes for other links', () => {
    expect(normalizeLink('https://Example.com/notes/?ref=x')).toBe(normalizeLink('https://example.com/notes'));
    expect(normalizeLink('https://example.com/a')).not.toBe(normalizeLink('https://example.com/b'));
  });
});
