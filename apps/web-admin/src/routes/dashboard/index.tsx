/**
 * Admin dashboard (Brilliant: 04 Admin — Dashboard): greeting with the
 * attention count and last change, four KPI cards, "Needs attention", recent
 * changes and lectures added per month.
 */
import type * as React from 'react';
import { useState } from 'react';
import { useApiUrl, useCustom, useGetIdentity } from '@refinedev/core';
import { ListVideo, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { actorName, formatAgo, formatUpdated } from '../../utils/relative-time';
import { describeChange, type Change } from '../../utils/describe-change';
import { NewSubjectDialog } from '../subjects/NewSubjectDialog';
import { ImportPlaylistLauncher } from '../subjects/ImportPlaylistLauncher';
import { nextOrderIndexFor, useSubjectsHealth } from '../subjects/subjects-health';
import { NeedsAttention } from './NeedsAttention';
import { useAttention } from './attention';

type Summary = {
  subjects: { total: number; live: number; hidden: number };
  lectures: { total: number; thisMonth: number };
  students: { total: number; minYear: number | null; maxYear: number | null };
  nextExam: { id: string; title: string; start_date: string; subject: { code: string; year_level: number } | null } | null;
  lecturesPerMonth: Array<{ month: string; count: number }>;
  recentChanges: Change[];
};

type AdminIdentity = { name?: string; username?: string };

function greeting(): string {
  const hour = dayjs().hour();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function Kpi({ label, value, detail, tone }: { label: string; value: React.ReactNode; detail: React.ReactNode; tone?: 'up' }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-subtle">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink-1 tabular-nums">{value}</p>
      <p className={cn('mt-1 text-xs', tone === 'up' ? 'text-emerald-600' : 'text-ink-3')}>{detail}</p>
    </div>
  );
}

function Panel({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-slate-200/70 bg-white shadow-subtle', className)}>
      <h2 className="border-b border-slate-200/70 px-4 py-3 text-[13px] font-semibold text-ink-1">{title}</h2>
      {children}
    </section>
  );
}

function MonthBars({ data }: { data: Summary['lecturesPerMonth'] }) {
  const max = Math.max(1, ...data.map((entry) => entry.count));
  return (
    <div className="flex h-44 items-end gap-3 px-4 pb-3 pt-5" role="img" aria-label={data.map((entry) => `${dayjs(`${entry.month}-01`).format('MMMM')}: ${entry.count}`).join(', ')}>
      {data.map((entry, index) => {
        const current = index === data.length - 1;
        return (
          <div key={entry.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] tabular-nums text-ink-3">{entry.count}</span>
            <div
              className={cn('w-full max-w-12 rounded-t-sm', current ? 'bg-brand' : 'bg-brand/20')}
              style={{ height: `${Math.max(4, (entry.count / max) * 100)}%` }}
            />
            <span className={cn('text-[11px]', current ? 'font-semibold text-brand' : 'text-ink-3')}>
              {dayjs(`${entry.month}-01`).format('MMM')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const DashboardPage = () => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const summaryQuery = useCustom<Summary>({ url: `${apiUrl}/admin/statistics/summary`, method: 'get' });
  const summary = (summaryQuery.data?.data as unknown as { data?: Summary })?.data;
  const attention = useAttention();
  const { subjects } = useSubjectsHealth();
  const [newOpen, setNewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const name = identity?.name ?? identity?.username ?? '';
  const lastChange = summary?.recentChanges[0];
  const daysToExam = summary?.nextExam ? dayjs(summary.nextExam.start_date).startOf('day').diff(dayjs().startOf('day'), 'day') : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-1">
            {greeting()}
            {name ? `, ${name}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-ink-3">
            {attention.data ? `${attention.total} ${attention.total === 1 ? 'thing needs' : 'things need'} attention` : 'Checking content…'}
            {lastChange ? ` · last content change ${formatAgo(lastChange.created_at)} by ${actorName(lastChange.user_email)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <ListVideo />
            Import playlist
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus />
            New subject
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary ? (
          <>
            <Kpi label="Subjects" value={summary.subjects.total} detail={`${summary.subjects.live} live · ${summary.subjects.hidden} hidden`} />
            <Kpi
              label="Lectures"
              value={summary.lectures.total.toLocaleString()}
              detail={summary.lectures.thisMonth > 0 ? `+${summary.lectures.thisMonth} this month` : 'None added this month'}
              tone={summary.lectures.thisMonth > 0 ? 'up' : undefined}
            />
            <Kpi
              label="Students signed in"
              value={summary.students.total.toLocaleString()}
              detail={
                summary.students.minYear
                  ? summary.students.minYear === summary.students.maxYear
                    ? `Year ${summary.students.minYear}`
                    : `Years ${summary.students.minYear}–${summary.students.maxYear}`
                  : 'No year recorded yet'
              }
            />
            <Kpi
              label="Next exam on calendar"
              value={daysToExam === null ? '—' : daysToExam === 0 ? 'Today' : `${daysToExam} ${daysToExam === 1 ? 'day' : 'days'}`}
              detail={
                summary.nextExam
                  ? [summary.nextExam.subject?.code, summary.nextExam.title, summary.nextExam.subject ? `Year ${summary.nextExam.subject.year_level}` : null]
                      .filter(Boolean)
                      .join(' · ')
                  : 'No exams scheduled'
              }
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[106px] rounded-xl" />)
        )}
      </div>

      <NeedsAttention attention={attention} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent changes">
          {!summary ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          ) : summary.recentChanges.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-3">No changes yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.recentChanges.map((change) => (
                <li key={change.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate text-ink-1">{describeChange(change)}</span>
                  <span className="shrink-0 text-xs text-ink-3">{formatUpdated(change.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Lectures added per month">
          {summary ? <MonthBars data={summary.lecturesPerMonth} /> : <Skeleton className="m-4 h-36" />}
        </Panel>
      </div>

      <NewSubjectDialog open={newOpen} onOpenChange={setNewOpen} nextOrderIndex={nextOrderIndexFor(subjects)} />
      <ImportPlaylistLauncher open={importOpen} onOpenChange={setImportOpen} subjects={subjects} />
    </div>
  );
};

export default DashboardPage;
