/**
 * Students (Brilliant: 04 Admin — Students): everyone who signed in with
 * Google, with a side panel for the selected student — details, active
 * sessions and "Sign out all devices". Selection is kept in ?id= so the panel
 * can be linked to.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApiUrl, useCustom, useList, useOne } from '@refinedev/core';
import { Pencil, Search, Users, X } from 'lucide-react';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';
import dayjs from 'dayjs';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { useDebouncedValue } from '../../utils/table-filters';
import { formatUpdated } from '../../utils/relative-time';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { useMediaQuery } from '@/lib/use-media-query';

const PAGE_SIZE = 20;

type Session = { id: string; created: string; device: string; browser: string };

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function Avatar({ profile, size = 'sm' }: { profile: Pick<Profile, 'full_name' | 'avatar_url'>; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'size-11 text-sm' : 'size-7 text-[11px]';
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle font-semibold text-brand-hover`}>
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(profile.full_name)
      )}
    </span>
  );
}

const capitalise = (value: string) => (value && value !== 'unknown' ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown');

function StudentPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const apiUrl = useApiUrl();
  const { data, isLoading } = useOne<Profile>({ resource: 'profiles', id });
  const sessionsQuery = useCustom<Session[]>({
    url: `${apiUrl}/admin/profiles/${id}/sessions`,
    method: 'get',
    queryOptions: { queryKey: ['student-sessions', id] },
  });
  const sessions = (sessionsQuery.data?.data as unknown as { data?: Session[] })?.data ?? [];
  const [revoking, setRevoking] = useState(false);
  const profile = data?.data;

  const signOutEverywhere = async () => {
    setRevoking(true);
    try {
      const response = await authAxios.post(`${apiUrl}/admin/profiles/${id}/revoke-sessions`);
      const revoked = response.data?.data?.revoked ?? 0;
      notify.success(revoked > 0 ? `Signed out of ${revoked} ${revoked === 1 ? 'device' : 'devices'}` : 'No active sign-ins to end');
      await sessionsQuery.refetch();
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Could not sign this student out.'));
    } finally {
      setRevoking(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const rows: Array<[string, React.ReactNode]> = [
    ['Email', profile.email],
    ['Student ID', profile.student_id || '—'],
    ['Year (from ID)', profile.year_level ?? '—'],
    ['Joined', dayjs(profile.created_at).format('D MMM YYYY')],
  ];

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <Avatar profile={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink-1">{profile.full_name}</p>
          <p className="text-xs text-ink-3">
            {profile.role === UserRole.ADMIN ? 'Admin' : 'Student'}
            {profile.year_level ? ` · Year ${profile.year_level}` : ''}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
          <X />
        </Button>
      </div>

      <dl className="space-y-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-ink-3">{label}</dt>
            <dd className="truncate text-right text-ink-1">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-1">Active sessions · {sessions.length}</p>
        {sessionsQuery.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : sessions.length === 0 ? (
          <p className="text-xs text-ink-3">Not signed in on any device.</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {sessions.map((session) => (
              <li key={session.id} className="flex justify-between gap-3">
                <span className="text-ink-1">
                  {capitalise(session.device)} · {capitalise(session.browser)}
                </span>
                <span className="text-ink-3">{formatUpdated(session.created)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmButton
        title={`Sign ${profile.full_name} out everywhere?`}
        description="Every device they’re signed in on is signed out. They can sign in again right away with Google."
        confirmLabel="Sign out all devices"
        onConfirm={() => void signOutEverywhere()}
        trigger={
          <Button variant="secondary" className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50" loading={revoking}>
            Sign out all devices
          </Button>
        }
      />
      <p className="-mt-2 text-[11px] text-ink-3">Use when a student reports a lost phone. They can sign in again right away with Google.</p>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link to={`/profiles/edit/${profile.id}`}>
          <Pencil />
          Edit details
        </Link>
      </Button>
    </div>
  );
}

const ProfilesList = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search, 350);
  const year = params.get('year') ?? 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const selectedId = params.get('id');
  const wide = useMediaQuery('(min-width: 1280px)');

  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null || value === 'all') next.delete(key);
        else next.set(key, value);
        if (key !== 'page' && key !== 'id') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const filters = useMemo(() => {
    const list: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (debouncedSearch.trim()) list.push({ field: 'search', operator: 'contains', value: debouncedSearch.trim() });
    if (year !== 'all') list.push({ field: 'year_level', operator: 'eq', value: Number(year) });
    return list;
  }, [debouncedSearch, year]);

  const { data, isLoading } = useList<Profile>({ resource: 'profiles', filters, pagination: { current: page, pageSize: PAGE_SIZE } });
  const { data: everyone } = useList<Profile>({ resource: 'profiles', pagination: { current: 1, pageSize: 1 } });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnDef<Profile, unknown>[] = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar profile={row.original} />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-1">{row.original.full_name}</p>
              <p className="truncate text-[11px] text-ink-3">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'student_id', header: 'ID', size: 110, cell: ({ row }) => <span className="tabular-nums">{row.original.student_id || '—'}</span> },
      { accessorKey: 'year_level', header: 'Year', size: 70, cell: ({ row }) => row.original.year_level ?? '—' },
      {
        accessorKey: 'created_at',
        header: 'Joined',
        size: 110,
        cell: ({ row }) => <span className="whitespace-nowrap text-ink-3">{dayjs(row.original.created_at).format('D MMM YYYY')}</span>,
      },
    ],
    [],
  );

  const table = (
    <DataTable
      columns={columns}
      data={rows}
      loading={isLoading}
      getRowId={(row) => row.id}
      pageIndex={page - 1}
      pageSize={PAGE_SIZE}
      pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      total={total}
      onPageChange={(index) => setParam('page', index === 0 ? null : String(index + 1))}
      onRowClick={(row) => setParam('id', row.id)}
      selectedRowId={selectedId}
      emptyState={<AdminEmptyState icon={<Users />} title="No students found" subtitle="Try another name, email, ID or year." />}
    />
  );

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${(everyone?.total ?? 0).toLocaleString()} signed-in students · profiles come from Google sign-in`}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setParam('q', event.target.value || null);
          }}
          placeholder="Name, email or student ID"
          aria-label="Search students"
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
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {table}
        {selectedId && wide ? (
          <aside className="sticky top-6 rounded-xl border border-slate-200/70 bg-white shadow-subtle xl:block" aria-label="Student details">
            <StudentPanel key={selectedId} id={selectedId} onClose={() => setParam('id', null)} />
          </aside>
        ) : null}
      </div>

      {/* Narrow screens: the same panel as a sheet. */}
      <Sheet open={Boolean(selectedId) && !wide} onOpenChange={(open) => !open && setParam('id', null)}>
        <SheetContent side="right" className="p-0">
          <SheetTitle>Student details</SheetTitle>
          {selectedId ? <StudentPanel key={selectedId} id={selectedId} onClose={() => setParam('id', null)} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfilesList;
