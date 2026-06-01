/**
 * Team Members List Page
 * Admin management of the people shown on the public About Us page.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, UsersRound } from 'lucide-react';
import type { TeamMember } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const TeamMembersList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount } = useTable<TeamMember>({
    resource: 'team-members',
    syncWithLocation: true,
  });
  const { mutate: deleteOne } = useDelete();

  const columns: ColumnDef<TeamMember, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: ({ row }) => {
          const { full_name, role, avatar_url } = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {avatar_url ? (
                  <img src={avatar_url} alt={full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                    {initialsOf(full_name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{full_name}</p>
                <p className="truncate text-xs text-slate-500">{role}</p>
              </div>
            </div>
          );
        },
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
              <Link to={`/team-members/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete team member?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'team-members', id: row.original.id })}
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
        title="Team Members"
        description="Manage the people shown on the public About Us page."
        actions={
          <Button asChild>
            <Link to="/team-members/create">
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
            icon={<UsersRound />}
            title="No team members yet"
            subtitle="Add the people who built the portal to show them on the About Us page."
          />
        }
      />
    </div>
  );
};

export default TeamMembersList;
