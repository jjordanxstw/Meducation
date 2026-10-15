/**
 * Subjects & lectures (Brilliant: 04 Admin — Subjects list). One row per
 * subject with its content size and health; clicking a row opens the tree
 * editor. Data comes from /admin/statistics/subjects-health, filtered and
 * paged on the client (a faculty has tens of subjects, not thousands).
 */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, CircleMinus, Layers, ListVideo, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { formatUpdated } from '../../utils/relative-time';
import { NewSubjectDialog } from './NewSubjectDialog';
import { ImportPlaylistLauncher } from './ImportPlaylistLauncher';
import { nextOrderIndexFor, useSubjectsHealth, type SubjectHealth } from './subjects-health';

function Health({ subject }: { subject: SubjectHealth }) {
  if (subject.lectures_count === 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-3">
        <CircleMinus className="size-3.5" aria-hidden />
        Empty
      </span>
    );
  if (subject.empty_lectures_count > 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700">
        <AlertCircle className="size-3.5 fill-amber-500 text-white" aria-hidden />
        {subject.empty_lectures_count} empty {subject.empty_lectures_count === 1 ? 'lecture' : 'lectures'}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-2">
      <CheckCircle2 className="size-3.5 fill-emerald-500 text-white" aria-hidden />
      OK
    </span>
  );
}

const PAGE_SIZE = 15;

const SubjectsList = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { subjects, isLoading } = useSubjectsHealth();
  const [search, setSearch] = useState('');
  // /subjects/create and the dashboard's "New subject" land here with ?new=1.
  const [newOpen, setNewOpen] = useState(() => params.get('new') === '1');
  const [importOpen, setImportOpen] = useState(false);
  const year = params.get('year') ?? 'all';
  const status = params.get('status') ?? 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setParam = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === 'all' || (key === 'page' && value === '1')) next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subjects.filter(
      (subject) =>
        (year === 'all' || String(subject.year_level) === year) &&
        (status === 'all' || (status === 'live') === subject.is_active) &&
        (!term || subject.name.toLowerCase().includes(term) || subject.code.toLowerCase().replace(/\s/g, '').includes(term.replace(/\s/g, ''))),
    );
  }, [subjects, search, year, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pageCount) - 1;
  const rows = filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

  const totals = subjects.reduce(
    (sum, subject) => ({ sections: sum.sections + subject.sections_count, lectures: sum.lectures + subject.lectures_count }),
    { sections: 0, lectures: 0 },
  );

  const columns: ColumnDef<SubjectHealth, unknown>[] = useMemo(
    () => [
      { accessorKey: 'code', header: 'Code', size: 110, cell: ({ row }) => <span className="font-semibold text-ink-1">{row.original.code}</span> },
      { accessorKey: 'name', header: 'Subject', cell: ({ row }) => <span className="text-ink-1">{row.original.name}</span> },
      { accessorKey: 'year_level', header: 'Year', size: 90, cell: ({ row }) => <span className="text-ink-2">Year {row.original.year_level}</span> },
      {
        id: 'content',
        header: 'Content',
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-2 tabular-nums">
            {row.original.sections_count} sec · {row.original.lectures_count} lec
          </span>
        ),
      },
      { id: 'health', header: 'Health', size: 160, cell: ({ row }) => <Health subject={row.original} /> },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 90,
        cell: ({ row }) => <StatusPill tone={row.original.is_active ? 'live' : 'hidden'}>{row.original.is_active ? 'Live' : 'Hidden'}</StatusPill>,
      },
      {
        accessorKey: 'content_updated_at',
        header: 'Updated',
        size: 110,
        cell: ({ row }) => <span className="whitespace-nowrap text-ink-3">{formatUpdated(row.original.content_updated_at)}</span>,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Subjects & lectures"
        description={`${subjects.length} subjects · ${totals.sections} sections · ${totals.lectures} lectures`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <ListVideo />
              Import playlist
            </Button>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus />
              New subject
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setParam('page', '1');
          }}
          placeholder="Search name or code"
          aria-label="Search subjects"
          startContent={<Search className="size-4" />}
          wrapperClassName="h-9 w-full sm:w-64"
        />
        <Select value={year} onValueChange={(value) => setParam('year', value)}>
          <SelectTrigger className="h-9 w-auto gap-2" aria-label="Year">
            <SelectValue>{year === 'all' ? 'Year: All' : `Year: ${year}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <SelectItem key={value} value={String(value)}>
                Year {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setParam('status', value)}>
          <SelectTrigger className="h-9 w-auto gap-2" aria-label="Status">
            <SelectValue>{status === 'all' ? 'Status: All' : status === 'live' ? 'Status: Live' : 'Status: Hidden'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(row) => row.id}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={pageCount}
        total={filtered.length}
        onPageChange={(index) => setParam('page', String(index + 1))}
        onRowClick={(row) => navigate(`/subjects/edit/${row.id}`)}
        emptyState={
          subjects.length === 0 ? (
            <AdminEmptyState
              icon={<Layers />}
              title="No subjects yet"
              subtitle="Create a subject, then add its sections and lectures."
              action={{ label: 'New subject', onClick: () => setNewOpen(true) }}
            />
          ) : (
            <AdminEmptyState icon={<Search />} title="No matching subjects" subtitle="Try another name, code or filter." />
          )
        }
      />

      <NewSubjectDialog
        open={newOpen}
        onOpenChange={(next) => {
          setNewOpen(next);
          if (!next && params.has('new')) setParam('new', 'all');
        }}
        defaultYear={year === 'all' ? 1 : Number(year)}
        nextOrderIndex={nextOrderIndexFor(subjects)}
      />
      <ImportPlaylistLauncher open={importOpen} onOpenChange={setImportOpen} subjects={subjects} />
    </div>
  );
};

export default SubjectsList;
