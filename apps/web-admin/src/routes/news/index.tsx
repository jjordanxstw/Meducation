/**
 * News List Page
 * Admin management of "Hot News" articles shown on the student home dashboard.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, Newspaper, Star } from 'lucide-react';
import { formatDateShort, type News } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const NewsList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount } = useTable<News>({
    resource: 'news',
    syncWithLocation: true,
  });
  const { mutate: deleteOne } = useDelete();

  const columns: ColumnDef<News, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Article',
        cell: ({ row }) => {
          const { title, cover_image_url, is_featured } = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {cover_image_url ? (
                  <img src={cover_image_url} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Newspaper className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium text-slate-900">
                  {is_featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                  {title}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const category = row.original.category;
          if (!category) return <span className="text-slate-400">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: category.color || '#2f80ed' }}
              />
              <span className="text-slate-700">{category.name}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'author_name',
        header: 'Author',
        cell: ({ getValue }) => <span className="text-slate-500">{(getValue() as string) || '—'}</span>,
      },
      {
        accessorKey: 'is_published',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Published</Badge> : <Badge variant="neutral">Draft</Badge>,
      },
      {
        accessorKey: 'published_at',
        header: 'Published',
        cell: ({ getValue }) => (
          <span className="text-slate-500">{formatDateShort(getValue() as string)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/news/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete article?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'news', id: row.original.id })}
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
        title="Hot News"
        description="Manage the news articles shown on the student home dashboard."
        actions={
          <Button asChild>
            <Link to="/news/create">
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
            icon={<Newspaper />}
            title="No news yet"
            subtitle="Write your first article to show it on the student home dashboard."
          />
        }
      />
    </div>
  );
};

export default NewsList;
