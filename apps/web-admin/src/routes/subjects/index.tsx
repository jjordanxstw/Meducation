/**
 * Subjects List Page
 * Admin management of subject metadata, including cover images shown on the
 * student portal's subject cards.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, BookOpen } from 'lucide-react';
import type { Subject } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const SubjectsList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount } = useTable<Subject>({
    resource: 'subjects',
    syncWithLocation: true,
  });
  const { mutate: deleteOne } = useDelete();

  const columns: ColumnDef<Subject, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Subject',
        cell: ({ row }) => {
          const { name, code, thumbnail_url } = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {thumbnail_url ? (
                  <img src={thumbnail_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <BookOpen className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{name}</p>
                <p className="truncate font-mono text-xs uppercase text-slate-500">{code}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'year_level',
        header: 'Year',
        cell: ({ getValue }) => <span className="text-slate-500">Year {getValue() as number}</span>,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Hidden</Badge>,
      },
      {
        accessorKey: 'order_index',
        header: 'Order',
        cell: ({ getValue }) => <span className="text-slate-500">{(getValue() as number) ?? 0}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/subjects/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete subject?"
              description="Sections, lectures and resources under it are preserved. You can undo within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'subjects', id: row.original.id })}
              trigger={
                <Button size="sm" variant="danger-ghost">
                  Delete
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deleteOne],
  );

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subjects and their cover images shown on the student portal."
        actions={
          <Button asChild>
            <Link to="/subjects/create">
              <Plus />
              Create
            </Link>
          </Button>
        }
      />

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
        emptyState={
          <AdminEmptyState
            icon={<BookOpen />}
            title="No subjects yet"
            subtitle="Create your first subject to show it on the student portal."
          />
        }
      />
    </div>
  );
};

export default SubjectsList;
