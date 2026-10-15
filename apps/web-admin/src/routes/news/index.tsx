/**
 * News (Brilliant: 04 Admin — News list): articles with category, publish date
 * and status; the featured one leads the student Today page.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDelete, useList } from '@refinedev/core';
import { Ellipsis, ImageIcon, Newspaper, Plus, Search, Star, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import type { News } from '@medical-portal/shared';
import { useDebouncedValue } from '../../utils/table-filters';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const PAGE_SIZE = 15;

const NewsList = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search, 350);
  const status = params.get('status') ?? 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { mutate: deleteOne } = useDelete();

  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null || value === 'all') next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const filters = useMemo(() => {
    const list: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (debouncedSearch.trim()) list.push({ field: 'search', operator: 'contains', value: debouncedSearch.trim() });
    if (status !== 'all') list.push({ field: 'is_published', operator: 'eq', value: status === 'published' });
    return list;
  }, [debouncedSearch, status]);

  const { data, isLoading } = useList<News>({ resource: 'news', filters, pagination: { current: page, pageSize: PAGE_SIZE } });
  const { data: everything } = useList<News>({ resource: 'news', pagination: { current: 1, pageSize: 1 } });
  const total = data?.total ?? 0;

  const columns: ColumnDef<News, unknown>[] = useMemo(
    () => [
      {
        id: 'article',
        header: 'Article',
        cell: ({ row }) => {
          const { title, cover_image_url, author_name } = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {cover_image_url ? (
                  <img src={cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageIcon className="size-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-1">{title}</p>
                {author_name ? <p className="truncate text-[11px] text-ink-3">by {author_name}</p> : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        size: 150,
        cell: ({ row }) => {
          const category = row.original.category;
          if (!category) return <span className="text-ink-3">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: category.color || '#2f80ed' }} />
              {category.name}
            </span>
          );
        },
      },
      {
        accessorKey: 'published_at',
        header: 'Published',
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-2">
            {row.original.is_published && row.original.published_at ? dayjs(row.original.published_at).format('D MMM YYYY') : '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        size: 170,
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            {row.original.is_published ? <StatusPill tone="live">Published</StatusPill> : <StatusPill tone="neutral">Draft</StatusPill>}
            {row.original.is_featured ? (
              <StatusPill tone="brand">
                <Star className="size-3 fill-current" aria-hidden />
                Featured
              </StatusPill>
            ) : null}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 90,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <Link to={`/news/edit/${row.original.id}`} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle">
              Edit
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`More actions for ${row.original.title}`} className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-slate-100">
                <Ellipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ConfirmButton
                  title="Delete this article?"
                  description="You can undo this within a few seconds."
                  confirmLabel="Delete"
                  onConfirm={() => deleteOne({ resource: 'news', id: row.original.id })}
                  trigger={
                    <DropdownMenuItem variant="danger" onSelect={(event) => event.preventDefault()}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [deleteOne],
  );

  return (
    <div>
      <PageHeader
        title="News"
        description={`${everything?.total ?? 0} articles · the featured one leads the student Today page`}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to="/news-categories">Categories</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/news/create">
                <Plus />
                Write article
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setParam('q', event.target.value || null);
          }}
          placeholder="Search title"
          aria-label="Search news"
          startContent={<Search className="size-4" />}
          wrapperClassName="h-9 w-full sm:w-64"
        />
        <Segmented
          aria-label="Status"
          value={status}
          onChange={(value) => setParam('status', value)}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Published', value: 'published' },
            { label: 'Drafts', value: 'drafts' },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        getRowId={(row) => row.id}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        onPageChange={(index) => setParam('page', index === 0 ? null : String(index + 1))}
        onRowClick={(row) => navigate(`/news/edit/${row.id}`)}
        emptyState={
          <AdminEmptyState icon={<Newspaper />} title={status === 'drafts' ? 'No drafts' : 'No articles yet'} subtitle="Write an article to show it on the student Today page." />
        }
      />
    </div>
  );
};

export default NewsList;
