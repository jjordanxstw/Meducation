/**
 * Learning Resources List Page
 * Admin management of "Learning Hub" cards shown on the student portal.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, GraduationCap } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const LearningResourcesList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount } = useTable<LearningResource>({
    resource: 'learning-resources',
    syncWithLocation: true,
  });
  const { mutate: deleteOne } = useDelete();

  const columns: ColumnDef<LearningResource, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Card',
        cell: ({ row }) => {
          const { title, image_url } = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {image_url ? (
                  <img src={image_url} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{title}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'author_name',
        header: 'Author',
        cell: ({ getValue }) => <span className="text-slate-500">{(getValue() as string) || '—'}</span>,
      },
      {
        id: 'categories',
        header: 'Content',
        cell: ({ row }) => {
          const categories = row.original.categories ?? [];
          const linkCount = categories.reduce((sum, c) => sum + (c.links?.length ?? 0), 0);
          return (
            <span className="text-slate-500">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} · {linkCount}{' '}
              {linkCount === 1 ? 'link' : 'links'}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_published',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Published</Badge> : <Badge variant="neutral">Draft</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/learning-resources/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete learning resource?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'learning-resources', id: row.original.id })}
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
        title="Learning Hub"
        description="Manage the learning resource cards shown on the student portal."
        actions={
          <Button asChild>
            <Link to="/learning-resources/create">
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
            icon={<GraduationCap />}
            title="No learning resources yet"
            subtitle="Create your first card to show it in the student Learning Hub."
          />
        }
      />
    </div>
  );
};

export default LearningResourcesList;
