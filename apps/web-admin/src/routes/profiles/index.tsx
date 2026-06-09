/**
 * Profiles List Page
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from '@refinedev/core';
import { Eye, Pencil, Users } from 'lucide-react';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { useTableSorting } from '../../utils/use-table-sorting';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const ProfilesList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount, setFilters, filters, sorters, setSorters } =
    useTable<Profile>({ resource: 'profiles', syncWithLocation: true });
  const { sorting, onSortingChange } = useTableSorting(sorters, setSorters);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [yearLevel, setYearLevel] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback(
    (searchValue: string) => {
      const next: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
      if (searchValue.trim()) next.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
      if (role) next.push({ field: 'role', operator: 'eq', value: role });
      if (yearLevel) next.push({ field: 'year_level', operator: 'eq', value: Number(yearLevel) });
      return next;
    },
    [role, yearLevel],
  );

  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    setSearch(typeof getFilterValue(filters, 'search') === 'string' ? (getFilterValue(filters, 'search') as string) : '');
    setRole(typeof getFilterValue(filters, 'role') === 'string' ? (getFilterValue(filters, 'role') as string) : undefined);
    const yl = getFilterValue(filters, 'year_level');
    setYearLevel(typeof yl === 'number' ? String(yl) : typeof yl === 'string' ? yl : undefined);
    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setRole(undefined);
    setYearLevel(undefined);
    setFilters([], 'replace');
  };

  const columns: ColumnDef<Profile, unknown>[] = useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        cell: ({ row }) => {
          const { full_name, avatar_url } = row.original;
          return (
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle text-xs font-semibold text-brand">
              {avatar_url ? (
                <img src={avatar_url} alt={full_name} className="size-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (full_name?.charAt(0)?.toUpperCase() ?? '?')
              )}
            </span>
          );
        },
      },
      { accessorKey: 'full_name', header: 'Full Name' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'student_id',
        header: 'Student ID',
        cell: ({ getValue }) => (getValue() as string) || '-',
      },
      {
        accessorKey: 'year_level',
        header: 'Year',
        cell: ({ getValue }) => (getValue() ? `Year ${getValue()}` : '-'),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) =>
          getValue() === UserRole.ADMIN ? <Badge variant="warning">Admin</Badge> : <Badge variant="brand">Student</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="icon-sm" variant="secondary" aria-label="View">
              <Link to={`/profiles/show/${row.original.id}`}>
                <Eye />
              </Link>
            </Button>
            <Button asChild size="icon-sm" variant="secondary" aria-label="Edit">
              <Link to={`/profiles/edit/${row.original.id}`}>
                <Pencil />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Profiles" description="View and manage student and admin accounts." />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
        <Input
          className="w-full sm:w-64"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-40">
          <Select value={role ?? '__all'} onValueChange={(v) => setRole(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All roles</SelectItem>
              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Select value={yearLevel ?? '__all'} onValueChange={(v) => setYearLevel(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All years</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Clear
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableQueryResult?.data?.data ?? []}
        loading={tableQueryResult?.isLoading}
        getRowId={(row) => row.id}
        pageIndex={current - 1}
        pageSize={pageSize}
        pageCount={pageCount}
        total={tableQueryResult?.data?.total}
        onPageChange={(idx) => setCurrent(idx + 1)}
        sorting={sorting}
        onSortingChange={onSortingChange}
        emptyState={<AdminEmptyState icon={<Users />} title="No profiles found" subtitle="Adjust your filters." />}
      />
    </div>
  );
};

export default ProfilesList;
