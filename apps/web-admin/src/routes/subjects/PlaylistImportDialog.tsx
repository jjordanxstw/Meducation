/**
 * "Import a YouTube playlist" (Brilliant: 04 Admin — Playlist importer). Paste a
 * playlist link (needs YOUTUBE_API_KEY on the API) or video links, choose the
 * section, untick or retitle videos, and they are appended to that section as
 * lectures with a "Lecture recording" resource. Videos already anywhere in the
 * subject are skipped. Nothing is saved until the admin saves the subject.
 */
import { useState } from 'react';
import { useApiUrl } from '@refinedev/core';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { authAxios } from '../../providers/auth-provider';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ImportedVideo = { videoId: string; url: string; title: string; durationSeconds: number | null; position: number };

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function PlaylistImportDialog({
  open,
  onOpenChange,
  sections,
  defaultSectionIndex,
  existing,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sections of this subject, by form index. */
  sections: Array<{ index: number; label: string }>;
  defaultSectionIndex?: number;
  /** videoId → "Section N" for videos already somewhere in this subject. */
  existing: Map<string, string>;
  onImport: (videos: ImportedVideo[], sectionIndex: number) => void;
}) {
  const apiUrl = useApiUrl();
  const [input, setInput] = useState('');
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);
  const [videos, setVideos] = useState<ImportedVideo[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sectionIndex, setSectionIndex] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetSection = sectionIndex || (defaultSectionIndex !== undefined ? String(defaultSectionIndex) : sections.at(-1) ? String(sections.at(-1)!.index) : '');

  const reset = () => {
    setInput('');
    setResolvedFor(null);
    setVideos(null);
    setTitles({});
    setSelected(new Set());
    setSectionIndex('');
    setError(null);
  };

  const resolve = async (text: string) => {
    const value = text.trim();
    if (!value || value === resolvedFor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.post(`${apiUrl}/admin/youtube/resolve`, { input: value });
      const items = (data?.data?.items ?? []) as ImportedVideo[];
      setVideos(items);
      setResolvedFor(value);
      setTitles(Object.fromEntries(items.map((video) => [video.videoId, video.title])));
      setSelected(
        new Set(items.filter((video) => !existing.has(video.videoId) && !video.title.startsWith('Unavailable')).map((video) => video.videoId)),
      );
    } catch (err) {
      setVideos(null);
      setResolvedFor(null);
      setError(resolveApiErrorMessage(err, 'Could not read that link.'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (videoId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });

  const chosen = (videos ?? [])
    .filter((video) => selected.has(video.videoId))
    .map((video) => ({ ...video, title: titles[video.videoId]?.trim() || video.title }));
  const isPlaylist = /[?&]list=/.test(resolvedFor ?? '');
  const quotaUnits = videos ? (isPlaylist ? 2 : 1) * Math.max(1, Math.ceil(videos.length / 50)) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <DialogTitle className="text-base">Import a YouTube playlist</DialogTitle>
          <DialogDescription className="text-xs">Creates one lecture per video in the section you choose</DialogDescription>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700">Playlist or video links</span>
              <Input
                autoFocus
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onPaste={(event) => {
                  const text = event.clipboardData.getData('text');
                  window.setTimeout(() => void resolve(text), 0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void resolve(input);
                  }
                }}
                placeholder="youtube.com/playlist?list=… or youtu.be/… youtu.be/…"
                wrapperClassName={cn('h-9', resolvedFor && resolvedFor === input.trim() && 'border-brand')}
                endContent={
                  loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : resolvedFor && resolvedFor === input.trim() ? (
                    <CheckCircle2 className="size-4 fill-emerald-500 text-white" aria-label="Link found" />
                  ) : null
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700">Add to</span>
              <Select value={targetSection} onValueChange={setSectionIndex}>
                <SelectTrigger className="h-9" aria-label="Add to section">
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.index} value={String(section.index)}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          {videos ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/70 px-3 py-2 text-[11px]">
                <span className="font-medium text-ink-2">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'} found · {chosen.length} selected
                </span>
                <span className="text-ink-3">Titles are editable before import</span>
              </div>
              {videos.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-3">No videos found.</p>
              ) : (
                <ul className="max-h-[45vh] divide-y divide-slate-100 overflow-y-auto">
                  {videos.map((video) => {
                    const already = existing.get(video.videoId);
                    const checked = selected.has(video.videoId);
                    return (
                      <li key={video.videoId} className={cn('flex items-center gap-3 px-3 py-2', already && 'bg-amber-50/70')}>
                        <Checkbox checked={checked} onCheckedChange={() => toggle(video.videoId)} aria-label={`Import ${titles[video.videoId]}`} />
                        <img
                          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className={cn('h-9 w-16 shrink-0 rounded-md bg-slate-200 object-cover', !checked && 'opacity-50')}
                        />
                        <span className="min-w-0 flex-1">
                          <input
                            value={titles[video.videoId] ?? ''}
                            onChange={(event) => setTitles((current) => ({ ...current, [video.videoId]: event.target.value }))}
                            aria-label="Lecture title"
                            className={cn(
                              'w-full rounded bg-transparent text-[13px] font-semibold text-ink-1 outline-none focus:bg-white focus:ring-1 focus:ring-slate-300',
                              !checked && 'font-normal text-ink-3',
                            )}
                          />
                          <span className={cn('block text-[11px]', already ? 'text-amber-700' : 'text-ink-3')}>
                            {already ? `Already in ${already} · skipped` : formatDuration(video.durationSeconds) || video.url}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          <p className="flex items-start gap-1.5 text-[11px] text-ink-3">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>
              A whole playlist needs the YouTube Data API key on the server (free, 10,000 units/day)
              {videos ? `; this import costs about ${quotaUnits} ${quotaUnits === 1 ? 'unit' : 'units'}` : ''}. Separate video
              links always work. Lecturer and taught date can be filled in afterwards.
            </span>
          </p>
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-200/70 bg-slate-50/70 px-6 py-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {videos ? (
            <Button
              type="button"
              size="sm"
              disabled={chosen.length === 0 || !targetSection}
              onClick={() => {
                onImport(chosen, Number(targetSection));
                reset();
                onOpenChange(false);
              }}
            >
              Import {chosen.length} {chosen.length === 1 ? 'lecture' : 'lectures'}
            </Button>
          ) : (
            <Button type="button" size="sm" loading={loading} disabled={!input.trim()} onClick={() => void resolve(input)}>
              Find videos
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
