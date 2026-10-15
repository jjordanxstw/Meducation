/**
 * "Needs attention" (Brilliant: 04 Admin — Dashboard): content problems
 * students would trip over, computed from existing data. Each row says what is
 * wrong, names the first few cases, and links to where it gets fixed.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { CalendarX, CheckCircle2, Copy, EyeOff, FileX, FolderOpen, Layers, Newspaper, UserRound, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Attention, AttentionState, LectureRef } from './attention';

type Tone = 'red' | 'amber' | 'slate' | 'blue';
type Row = {
  key: string;
  icon: typeof FileX;
  tone: Tone;
  title: string;
  detail: string;
  action: { label: string; href: string };
  links: Array<{ href: string; text: string }>;
  count: number;
};

const TONES: Record<Tone, string> = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-ink-3',
  blue: 'bg-brand-subtle text-brand',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const lectureLabel = (lecture: LectureRef) => `${lecture.subjectCode} ${lecture.title}`;
const editSubject = (subjectId: string) => `/subjects/edit/${subjectId}`;
/** "Students see an empty row · CVS 201 Heart, RS 202 Lungs" — first three names. */
const withExamples = (lead: string, names: string[], total: number) =>
  [lead, names.slice(0, 3).join(', ') + (total > 3 ? ` +${total - 3} more` : '')].filter(Boolean).join(' · ');

function buildRows(data: Attention): Row[] {
  const lectureRow = (
    key: string,
    bucket: Attention['lecturesWithoutFiles'],
    icon: typeof FileX,
    tone: Tone,
    title: string,
    lead: string,
    action: string,
  ): Row => ({
    key,
    icon,
    tone,
    title,
    detail: withExamples(lead, bucket.items.map(lectureLabel), bucket.count),
    action: { label: action, href: bucket.items[0] ? editSubject(bucket.items[0].subjectId) : '/subjects' },
    links: bucket.items.map((item) => ({ href: editSubject(item.subjectId), text: `${item.subjectCode} · ${item.sectionName} · ${item.title}` })),
    count: bucket.count,
  });

  const years = data.yearsWithoutUpcomingEvents;
  const firstYear = years.items[0];

  const rows: Row[] = [
    lectureRow(
      'no-files',
      data.lecturesWithoutFiles,
      FileX,
      'red',
      `${plural(data.lecturesWithoutFiles.count, 'lecture has', 'lectures have')} no files`,
      'Students see an empty row',
      'Fix',
    ),
    {
      key: 'duplicates',
      icon: Copy,
      tone: 'amber',
      title: `${plural(data.duplicateLinks.count, 'link is', 'links are')} used by more than one lecture`,
      detail: withExamples(
        'Likely copy-paste mistakes',
        data.duplicateLinks.items.map((dup) => `${dup.lectures[0]?.subjectCode ?? ''} ${dup.lectures.map((l) => l.title).join(' & ')}`),
        data.duplicateLinks.count,
      ),
      action: { label: 'Review', href: '/resources?duplicates=true' },
      links: data.duplicateLinks.items.flatMap((dup) =>
        dup.lectures.map((lecture) => ({ href: editSubject(lecture.subjectId), text: `${lecture.subjectCode} · ${lecture.title}` })),
      ),
      count: data.duplicateLinks.count,
    },
    {
      key: 'hidden-sections',
      icon: EyeOff,
      tone: 'slate',
      title: `${plural(data.hiddenSections.count, 'hidden section', 'hidden sections')} in a live subject`,
      detail: withExamples(
        '',
        data.hiddenSections.items.map((section) => `${section.subjectCode} · ${section.name} is hidden`),
        data.hiddenSections.count,
      ) + '. Intentional?',
      action: { label: 'Open', href: data.hiddenSections.items[0] ? editSubject(data.hiddenSections.items[0].subjectId) : '/subjects' },
      links: data.hiddenSections.items.map((section) => ({ href: editSubject(section.subjectId), text: `${section.subjectCode} · ${section.name}` })),
      count: data.hiddenSections.count,
    },
    {
      key: 'calendar-gap',
      icon: CalendarX,
      tone: 'blue',
      title:
        years.count === 1 && firstYear
          ? `Year ${firstYear.yearLevel} has no calendar events${firstYear.lastEventDate ? ` after ${dayjs(firstYear.lastEventDate).format('D MMM')}` : ''}`
          : `${years.count} years have no upcoming calendar events`,
      detail: `Students in ${years.items.map((item) => `Year ${item.yearLevel}`).join(', ')} see an empty “Coming up”`,
      action: { label: 'Add events', href: '/calendar/create' },
      links: [],
      count: years.count,
    },
    {
      key: 'empty-sections',
      icon: Layers,
      tone: 'amber',
      title: `${plural(data.emptySections.count, 'visible section has', 'visible sections have')} no lectures`,
      detail: withExamples('', data.emptySections.items.map((section) => `${section.subjectCode} · ${section.name}`), data.emptySections.count),
      action: { label: 'Open', href: data.emptySections.items[0] ? editSubject(data.emptySections.items[0].subjectId) : '/subjects' },
      links: data.emptySections.items.map((section) => ({ href: editSubject(section.subjectId), text: `${section.subjectCode} · ${section.name}` })),
      count: data.emptySections.count,
    },
    {
      key: 'empty-subjects',
      icon: FolderOpen,
      tone: 'amber',
      title: `${plural(data.emptySubjects.count, 'live subject has', 'live subjects have')} no lectures`,
      detail: withExamples('Hide them until content is ready', data.emptySubjects.items.map((subject) => subject.code), data.emptySubjects.count),
      action: { label: 'Open', href: data.emptySubjects.items[0] ? editSubject(data.emptySubjects.items[0].id) : '/subjects' },
      links: data.emptySubjects.items.map((subject) => ({ href: editSubject(subject.id), text: `${subject.code} · ${subject.name}` })),
      count: data.emptySubjects.count,
    },
    lectureRow(
      'no-video',
      data.lecturesWithoutVideo,
      Video,
      'slate',
      `${plural(data.lecturesWithoutVideo.count, 'lecture has', 'lectures have')} no recording`,
      'Slides or links only',
      'Review',
    ),
    lectureRow(
      'details',
      data.lecturesMissingDetails,
      UserRound,
      'slate',
      `${plural(data.lecturesMissingDetails.count, 'lecture is', 'lectures are')} missing a date or lecturer`,
      'Helps students find the right session',
      'Fix',
    ),
    {
      key: 'news-drafts',
      icon: Newspaper,
      tone: 'slate',
      title: `${plural(data.unpublishedNews.count, 'news draft is', 'news drafts are')} not published`,
      detail: 'Drafts stay invisible to students until published',
      action: { label: 'Open', href: '/news' },
      links: [],
      count: data.unpublishedNews.count,
    },
  ];
  return rows.filter((row) => row.count > 0);
}

export function NeedsAttention({ attention }: { attention: AttentionState }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = attention.data ? buildRows(attention.data) : [];

  return (
    <section className="rounded-xl border border-slate-200/70 bg-white shadow-subtle" aria-labelledby="needs-attention">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
        <h2 id="needs-attention" className="flex items-center gap-2 text-[13px] font-semibold text-ink-1">
          Needs attention
          {attention.total > 0 ? (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800">{attention.total}</span>
          ) : null}
        </h2>
        <span className="hidden text-[11px] text-ink-3 sm:inline">Checked from your published content</span>
      </div>

      {!attention.data && !attention.isError ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : attention.isError ? (
        <p className="p-4 text-sm text-ink-3">Couldn’t check content right now.</p>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 p-4">
          <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
          <p className="text-sm text-ink-2">All clear — every published lecture has files, dates and a lecturer.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => {
            const Icon = row.icon;
            const expanded = open === row.key;
            return (
              <li key={row.key}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TONES[row.tone])}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    {row.links.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : row.key)}
                        aria-expanded={expanded}
                        className="block max-w-full truncate text-left text-[13px] font-semibold text-ink-1 hover:text-brand-hover"
                      >
                        {row.title}
                      </button>
                    ) : (
                      <p className="truncate text-[13px] font-semibold text-ink-1">{row.title}</p>
                    )}
                    <p className="truncate text-xs text-ink-3">{row.detail}</p>
                  </div>
                  <Link to={row.action.href} className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle">
                    {row.action.label}
                  </Link>
                </div>
                {expanded ? (
                  <ul className="space-y-1 px-4 pb-3 pl-[3.75rem]">
                    {row.links.map((link, i) => (
                      <li key={`${link.href}-${i}`}>
                        <Link to={link.href} className="block truncate text-xs text-brand-hover hover:underline">
                          {link.text}
                        </Link>
                      </li>
                    ))}
                    {row.count > row.links.length ? <li className="text-xs text-ink-3">+{row.count - row.links.length} more</li> : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
