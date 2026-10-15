import { extractPlaylistId, extractVideoIds, parseIsoDuration } from './youtube.service';

describe('YouTube link parsing', () => {
  it('parses ISO-8601 durations', () => {
    expect(parseIsoDuration('PT1H2M3S')).toBe(3723);
    expect(parseIsoDuration('PT45M')).toBe(2700);
    expect(parseIsoDuration('PT59S')).toBe(59);
    expect(parseIsoDuration('P1D')).toBeNull();
    expect(parseIsoDuration(undefined)).toBeNull();
  });

  it('finds the playlist id in watch and playlist URLs', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PLabcdefghij123')).toBe('PLabcdefghij123');
    expect(extractPlaylistId('https://youtube.com/watch?v=aqz-KE-bpKQ&list=PLabcdefghij123&index=2')).toBe('PLabcdefghij123');
    expect(extractPlaylistId('https://youtu.be/aqz-KE-bpKQ')).toBeNull();
  });

  it('extracts distinct video ids from every common link shape', () => {
    const input = [
      'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      'https://youtu.be/dQw4w9WgXcQ?t=10',
      'https://m.youtube.com/watch?v=aqz-KE-bpKQ', // duplicate
      'https://www.youtube.com/embed/9bZkp7q19f0',
      'https://www.youtube.com/shorts/kJQP7kiw5Fk',
      'oHg5SJYRHA0',
      'https://example.com/watch?v=xxxxxxxxxxx',
      'not a link',
    ].join('\n');
    expect(extractVideoIds(input)).toEqual(['aqz-KE-bpKQ', 'dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw5Fk', 'oHg5SJYRHA0']);
  });
});
