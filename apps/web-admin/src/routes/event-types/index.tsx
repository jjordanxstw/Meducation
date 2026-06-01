/**
 * Event Types List Page
 * Admin-managed calendar event types (name + color).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, Tags } from 'lucide-react';
import type { CalendarEventType } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const EventTypesList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount } = useTable<CalendarEventType>({
    resource: 'event-types',
    syncWithLocation: true,
  });
  const { mutate: deleteOne } = useDelete();

  const columns: ColumnDef<CalendarEventType, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const { name, color } = row.original;
          return (
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: color || '#2f80ed' }}
              />
              <span className="font-medium text-slate-900">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'color',
        header: 'Color',
        cell: ({ getValue }) => <span className="text-slate-500">{(getValue() as string) ?? '-'}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/event-types/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete event type?"
              description="A type that still has events cannot be deleted."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'event-types', id: row.original.id })}
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
        title="Event Types"
        description="Manage the calendar event types and their colors."
        actions={
          <Button asChild>
            <Link to="/event-types/create">
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
            icon={<Tags />}
            title="No event types yet"
            subtitle="Create your first event type to categorize calendar events."
          />
        }
      />
    </div>
  );
};

export default EventTypesList;
