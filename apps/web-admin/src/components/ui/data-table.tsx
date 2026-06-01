import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './skeleton';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  /** Rendered in place of the table body when there are no rows. */
  emptyState?: React.ReactNode;
  getRowId?: (row: TData) => string;
  // Manual pagination (driven by Refine core useTable).
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total?: number;
  onPageChange: (pageIndex: number) => void;
  // Manual sorting.
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyState,
  getRowId,
  pageIndex,
  pageSize,
  pageCount,
  total,
  onPageChange,
  sorting,
  onSortingChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: { sorting: sorting ?? [], pagination: { pageIndex, pageSize } },
    onSortingChange,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const showEmpty = !loading && data.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200/70 bg-slate-50/70">
                {headerGroup.headers.map((header) => {
                  // Only advertise sorting when the page actually wires it up,
                  // so non-sortable lists don't show dead sort affordances.
                  const canSort = header.column.getCanSort() && Boolean(onSortingChange);
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-600"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                  {columns.map((_col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : showEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  {emptyState ?? <p className="text-center text-sm text-slate-400">No data</p>}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-3">
        <p className="text-xs text-slate-400">
          {typeof total === 'number'
            ? `${total} ${total === 1 ? 'record' : 'records'}`
            : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={pageIndex <= 0}
            onClick={() => onPageChange(pageIndex - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange(pageIndex + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ColumnDef, SortingState };
